import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CoursesController } from './courses.controller.js';
import { UploadModule } from '../upload/upload.module.js';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [CoursesController],
})
export class CoursesModule {}
