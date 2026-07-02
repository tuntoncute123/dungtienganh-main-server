import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus } from '@nestjs/cqrs';
import { UploadFileCommand } from './commands/upload-file/upload-file.command.js';
import * as express from 'express';
import { diskStorage } from 'multer';
import * as os from 'os';

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
}
