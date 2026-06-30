import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UploadFileCommand } from './upload-file.command.js';
import { BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { Jimp } from 'jimp';

const execPromise = promisify(exec);
const ffmpeg = require('ffmpeg-static');

@CommandHandler(UploadFileCommand)
export class UploadFileHandler implements ICommandHandler<UploadFileCommand> {
  async execute(command: UploadFileCommand) {
    const { file, req } = command;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const isVideo = file.mimetype && file.mimetype.startsWith('video/');
    const isImage = file.mimetype && file.mimetype.startsWith('image/');
    let uploadBuffer = file.buffer;
    let finalMimetype = file.mimetype;
    let finalFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    // If it's an image, compress and resize it
    if (isImage) {
      try {
        const image = await Jimp.read(file.buffer);
        if (image.width > 800) {
          image.resize({ w: 800 });
        }
        uploadBuffer = await image.getBuffer('image/jpeg');
        finalMimetype = 'image/jpeg';
        const ext = path.extname(finalFilename);
        finalFilename = finalFilename.replace(ext, '.jpg');
      } catch (err) {
        console.error('Error during image compression:', err);
      }
    }

    // If it's a video, disable timeout and compress it to HLS via FFmpeg
    let isHlsUploaded = false;
    let hlsUrl = '';

    if (isVideo) {
      req.setTimeout(0); // Disable request timeout
      
      const tempDir = path.join(process.cwd(), 'temp_uploads');
      if (!existsSync(tempDir)) {
        await fs.mkdir(tempDir, { recursive: true });
      }

      const timestamp = Date.now();
      const tempRawPath = path.join(tempDir, `raw-${timestamp}-${file.originalname.replace(/\s+/g, '-')}`);
      const hlsFolderName = `video-${timestamp}`;
      const hlsOutputDir = path.join(tempDir, hlsFolderName);
      await fs.mkdir(hlsOutputDir, { recursive: true });

      try {
        // 1. Write raw video to temp file
        await fs.writeFile(tempRawPath, file.buffer);

        // 2. Convert & compress via FFmpeg to HLS format
        const m3u8Path = path.join(hlsOutputDir, 'index.m3u8');
        const segmentPattern = path.join(hlsOutputDir, 'segment_%03d.ts');
        const cmd = `"${ffmpeg}" -y -i "${tempRawPath}" -vcodec libx264 -preset superfast -crf 28 -vf "scale=-2:720" -acodec aac -b:a 128k -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_filename "${segmentPattern}" "${m3u8Path}"`;
        await execPromise(cmd);

        // 3. Prepare upload credentials
        const r2KeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
        const r2Secret = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
        const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
        const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
        const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

        const files = await fs.readdir(hlsOutputDir);

        if (r2KeyId && r2Secret && r2Bucket && r2Endpoint) {
          const s3Client = new S3Client({
            region: 'auto',
            endpoint: r2Endpoint,
            credentials: {
              accessKeyId: r2KeyId,
              secretAccessKey: r2Secret,
            },
          });

          // Upload each file in the HLS folder to R2
          for (const filename of files) {
            const filePath = path.join(hlsOutputDir, filename);
            const fileBuf = await fs.readFile(filePath);
            const relativeKey = `hls/${hlsFolderName}/${filename}`;
            let contentType = 'application/octet-stream';
            if (filename.endsWith('.m3u8')) {
              contentType = 'application/vnd.apple.mpegurl';
            } else if (filename.endsWith('.ts')) {
              contentType = 'video/MP2T';
            }

            await s3Client.send(
              new PutObjectCommand({
                Bucket: r2Bucket,
                Key: relativeKey,
                Body: fileBuf,
                ContentType: contentType,
              }),
            );
          }

          const publicBase = r2PublicUrl
            ? r2PublicUrl.replace(/\/$/, '')
            : `${r2Endpoint}/${r2Bucket}`;
          hlsUrl = `${publicBase}/hls/${hlsFolderName}/index.m3u8`;
          isHlsUploaded = true;
        } else {
          // Fallback: Save local folder structure
          const uploadDir = path.join(process.cwd(), '..', 'public', 'uploads', 'hls', hlsFolderName);
          await fs.mkdir(uploadDir, { recursive: true });

          for (const filename of files) {
            const filePath = path.join(hlsOutputDir, filename);
            const fileBuf = await fs.readFile(filePath);
            await fs.writeFile(path.join(uploadDir, filename), fileBuf);
          }

          hlsUrl = `/uploads/hls/${hlsFolderName}/index.m3u8`;
          isHlsUploaded = true;
        }
      } catch (err: any) {
        console.error('Error during video HLS conversion:', err);
      } finally {
        // Clean up raw temp file
        await fs.unlink(tempRawPath).catch(() => {});
        // Clean up temporary local HLS files and output directory
        try {
          const files = await fs.readdir(hlsOutputDir);
          for (const f of files) {
            await fs.unlink(path.join(hlsOutputDir, f)).catch(() => {});
          }
          await fs.rmdir(hlsOutputDir).catch(() => {});
        } catch (e) {}
      }
    }

    if (isVideo && isHlsUploaded) {
      return { url: hlsUrl };
    }

    const r2KeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2Secret = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    try {
      if (r2KeyId && r2Secret && r2Bucket && r2Endpoint) {
        // Cloudflare R2 S3 Client upload
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: r2Endpoint,
          credentials: {
            accessKeyId: r2KeyId,
            secretAccessKey: r2Secret,
          },
        });

        await s3Client.send(
          new PutObjectCommand({
            Bucket: r2Bucket,
            Key: finalFilename,
            Body: uploadBuffer,
            ContentType: finalMimetype,
          }),
        );

        const fileUrl = r2PublicUrl
          ? `${r2PublicUrl.replace(/\/$/, '')}/${finalFilename}`
          : `${r2Endpoint}/${r2Bucket}/${finalFilename}`;

        return { url: fileUrl };
      } else {
        // Fallback: Save file to public/uploads/
        const uploadDir = path.join(process.cwd(), '..', 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, finalFilename);
        await fs.writeFile(filePath, uploadBuffer);

        const fileUrl = `/uploads/${finalFilename}`;
        return { url: fileUrl };
      }
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to upload file');
    }
  }
}
