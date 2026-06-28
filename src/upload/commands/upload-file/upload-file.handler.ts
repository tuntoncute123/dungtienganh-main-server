import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UploadFileCommand } from './upload-file.command.js';
import { BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

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
    let uploadBuffer = file.buffer;
    let finalMimetype = file.mimetype;
    let finalFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    // If it's a video, disable timeout and compress it via FFmpeg
    if (isVideo) {
      req.setTimeout(0); // Disable request timeout
      
      const tempDir = path.join(process.cwd(), 'temp_uploads');
      if (!existsSync(tempDir)) {
        await fs.mkdir(tempDir, { recursive: true });
      }

      const tempRawPath = path.join(tempDir, `raw-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
      const tempCompressedName = `compressed-${Date.now()}-${path.parse(file.originalname).name.replace(/\s+/g, '-')}.mp4`;
      const tempCompressedPath = path.join(tempDir, tempCompressedName);

      try {
        // 1. Write raw video to temp file
        await fs.writeFile(tempRawPath, file.buffer);

        // 2. Compress via FFmpeg (Preset superfast, CRF 28, Scale HD 720p with even width constraint)
        const cmd = `"${ffmpeg}" -y -i "${tempRawPath}" -vcodec libx264 -preset superfast -crf 28 -vf "scale=-2:720" -acodec aac -b:a 128k "${tempCompressedPath}"`;
        await execPromise(cmd);

        // 3. Read compressed buffer
        uploadBuffer = await fs.readFile(tempCompressedPath);
        finalMimetype = 'video/mp4';
        finalFilename = tempCompressedName;
      } catch (err: any) {
        console.error('Error during video compression:', err);
        // If compression fails, fall back to raw upload so it doesn't block the user
      } finally {
        // Clean up temp files
        await fs.unlink(tempRawPath).catch(() => {});
        await fs.unlink(tempCompressedPath).catch(() => {});
      }
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
