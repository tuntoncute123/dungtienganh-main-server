import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UploadFileCommand } from './upload-file.command.js';
import { BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { Jimp } from 'jimp';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

@CommandHandler(UploadFileCommand)
export class UploadFileHandler implements ICommandHandler<UploadFileCommand> {
  async execute(command: UploadFileCommand) {
    const { file, req } = command;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Kiểm tra kích thước file (2GB max)
    if (file.size && file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File quá lớn. Giới hạn tối đa là 2GB, file của bạn là ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB`,
      );
    }

    const isVideo = file.mimetype && file.mimetype.startsWith('video/');
    const isImage = file.mimetype && file.mimetype.startsWith('image/');
    let uploadBuffer = file.buffer;
    let finalMimetype = file.mimetype;
    let finalFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    // Vô hiệu hóa timeout cho tất cả file lớn (> 10MB) hoặc video
    const fileSizeMB = (file.size || file.buffer?.length || 0) / 1024 / 1024;
    if (isVideo || fileSizeMB > 10) {
      req.setTimeout(0); // Không timeout khi upload file lớn
      if ((req as any).socket) {
        (req as any).socket.setTimeout(0);
      }
    }

    // Nếu là ảnh: compress và resize
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

    const r2KeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2Secret = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    try {
      if (r2KeyId && r2Secret && r2Bucket && r2Endpoint && r2PublicUrl) {
        // Upload lên Cloudflare R2
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: r2Endpoint,
          credentials: {
            accessKeyId: r2KeyId,
            secretAccessKey: r2Secret,
          },
          requestHandler: {
            requestTimeout: 0,      // Không timeout khi upload
            connectionTimeout: 0,   // Không timeout kết nối
          } as any,
        });

        await s3Client.send(
          new PutObjectCommand({
            Bucket: r2Bucket,
            Key: finalFilename,
            Body: uploadBuffer,
            ContentType: finalMimetype,
            ContentLength: uploadBuffer.length,
          }),
        );

        const fileUrl = r2PublicUrl
          ? `${r2PublicUrl.replace(/\/$/, '')}/${finalFilename}`
          : `${r2Endpoint}/${r2Bucket}/${finalFilename}`;

        return { url: fileUrl };
      } else {
        // Fallback: lưu file xuống disk local
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

