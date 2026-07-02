import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus } from '@nestjs/cqrs';
import { UploadFileCommand } from './commands/upload-file/upload-file.command.js';
import * as express from 'express';
import { diskStorage } from 'multer';
import * as os from 'os';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function cleanFilename(originalName: string): string {
  const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '';
  let name = originalName.substring(0, originalName.length - ext.length);

  // Chuyển tiếng Việt có dấu thành không dấu
  name = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');

  // Chuyển chữ thường, bỏ ký tự đặc biệt
  name = name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!name) {
    name = 'file';
  }

  return `${Date.now()}-${name}${ext.toLowerCase()}`;
}

@Controller('api/upload')
export class UploadController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      // Ghi file vào /tmp thay vì RAM — RAM không tăng dù file nặng đến đâu
      storage: diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => {
          const uniqueName = `tmp-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Req() req: express.Request,
  ) {
    return this.commandBus.execute(new UploadFileCommand(file, req));
  }

  @Get('presigned-url')
  async getPresignedUrl(
    @Query('filename') filename: string,
    @Query('mimetype') mimetype: string,
    @Query('folder') folder?: string,
  ) {
    if (!filename || !mimetype) {
      throw new BadRequestException('Missing filename or mimetype query parameters');
    }

    const r2KeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2Secret = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (!r2KeyId || !r2Secret || !r2Bucket || !r2Endpoint || !r2PublicUrl) {
      throw new BadRequestException('Cloudflare R2 is not fully configured on the server');
    }

    try {
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: r2Endpoint,
        credentials: {
          accessKeyId: r2KeyId,
          secretAccessKey: r2Secret,
        },
      });

      // Chuẩn hóa thư mục ảo
      let folderPrefix = '';
      if (folder) {
        folderPrefix = folder
          .replace(/\\/g, '/')
          .replace(/^\/+|\/+$/g, '')
          .replace(/[^a-zA-Z0-9_\-\/]/g, '');
        if (folderPrefix) {
          folderPrefix = folderPrefix + '/';
        }
      }

      const cleanedName = cleanFilename(filename);
      const finalFilename = `${folderPrefix}${cleanedName}`;

      const command = new PutObjectCommand({
        Bucket: r2Bucket,
        Key: finalFilename,
        ContentType: mimetype,
      });

      // Tạo presigned URL có hiệu lực trong 15 phút (900 giây)
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
      const fileUrl = `${r2PublicUrl.replace(/\/$/, '')}/${finalFilename}`;

      return { uploadUrl, fileUrl };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to generate presigned URL');
    }
  }
}
