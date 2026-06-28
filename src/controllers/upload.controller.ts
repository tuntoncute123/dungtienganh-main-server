import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';

@Controller('api/upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

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
            Key: filename,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );

        const fileUrl = r2PublicUrl
          ? `${r2PublicUrl.replace(/\/$/, '')}/${filename}`
          : `${r2Endpoint}/${r2Bucket}/${filename}`;

        return { url: fileUrl };
      } else {
        // Fallback: Save file to Next.js public/uploads/ directory
        // NestJS server is in 'teacherdung-backend' which is a sibling to Next.js root
        const uploadDir = path.join(process.cwd(), '..', 'public', 'uploads');

        // Ensure directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, file.buffer);

        const fileUrl = `/uploads/${filename}`;
        return { url: fileUrl };
      }
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to upload file');
    }
  }
}
