import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus } from '@nestjs/cqrs';
import { UploadFileCommand } from './commands/upload-file/upload-file.command.js';
import * as express from 'express';
import { diskStorage } from 'multer';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

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

  @Post('chunk')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => {
          const uniqueName = `chunk-tmp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per chunk limit
      },
    }),
  )
  async uploadChunk(
    @UploadedFile() file: any,
    @Body('uploadId') uploadId: string,
    @Body('chunkIndex') chunkIndex: string,
  ) {
    if (!file) {
      throw new BadRequestException('No chunk uploaded');
    }
    if (!uploadId || chunkIndex === undefined) {
      await fs.unlink(file.path).catch(() => {});
      throw new BadRequestException('Missing uploadId or chunkIndex');
    }

    const chunkDir = path.join(os.tmpdir(), `upload_${uploadId}`);
    await fs.mkdir(chunkDir, { recursive: true });
    const destPath = path.join(chunkDir, `chunk_${chunkIndex}`);

    // Di chuyển file chunk tạm về thư mục chứa chunks của uploadId
    await fs.rename(file.path, destPath).catch(async () => {
      await fs.copyFile(file.path, destPath);
      await fs.unlink(file.path).catch(() => {});
    });

    return { success: true };
  }

  @Post('merge')
  async mergeChunks(
    @Body('uploadId') uploadId: string,
    @Body('filename') filename: string,
    @Body('mimetype') mimetype: string,
    @Body('totalChunks') totalChunks: number,
    @Req() req: express.Request,
  ) {
    if (!uploadId || !filename || !mimetype || !totalChunks) {
      throw new BadRequestException('Missing required fields for merge');
    }

    const chunkDir = path.join(os.tmpdir(), `upload_${uploadId}`);
    const mergedFilename = `tmp-merged-${Date.now()}-${filename.replace(/\s+/g, '-')}`;
    const mergedFilePath = path.join(os.tmpdir(), mergedFilename);

    try {
      // Mở file ghép để bắt đầu ghi đè
      const mergedFileHandle = await fs.open(mergedFilePath, 'w');

      // Đọc và ghép nối tiếp các chunk theo thứ tự
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `chunk_${i}`);
        try {
          const chunkBuffer = await fs.readFile(chunkPath);
          await mergedFileHandle.write(chunkBuffer);
        } catch (err) {
          await mergedFileHandle.close();
          await fs.unlink(mergedFilePath).catch(() => {});
          throw new BadRequestException(`Missing chunk ${i}`);
        }
      }
      await mergedFileHandle.close();

      // Lấy dung lượng file sau khi ghép
      const stat = await fs.stat(mergedFilePath);

      // Dọn dẹp thư mục chứa các chunk
      await fs.rm(chunkDir, { recursive: true, force: true }).catch(() => {});

      // Giả lập đối tượng file của multer
      const mockFile = {
        fieldname: 'file',
        originalname: filename,
        encoding: '7bit',
        mimetype: mimetype,
        destination: os.tmpdir(),
        filename: mergedFilename,
        path: mergedFilePath,
        size: stat.size,
      };

      // Chuyển cho command handler xử lý tải lên Cloudflare R2 giống như bình thường
      return await this.commandBus.execute(new UploadFileCommand(mockFile, req));

    } catch (error: any) {
      await fs.unlink(mergedFilePath).catch(() => {});
      await fs.rm(chunkDir, { recursive: true, force: true }).catch(() => {});
      throw new BadRequestException(error.message || 'Failed to merge chunks');
    }
  }
}
