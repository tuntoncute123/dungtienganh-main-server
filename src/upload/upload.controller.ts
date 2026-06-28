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

@Controller('api/upload')
export class UploadController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Req() req: express.Request,
  ) {
    return this.commandBus.execute(new UploadFileCommand(file, req));
  }
}
