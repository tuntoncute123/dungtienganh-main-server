import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UploadController } from './upload.controller.js';
import { UploadFileHandler } from './commands/upload-file/upload-file.handler.js';
import { UploadService } from './upload.service.js';

@Module({
  imports: [CqrsModule],
  controllers: [UploadController],
  providers: [UploadFileHandler, UploadService],
  exports: [UploadService],
})
export class UploadModule {}
