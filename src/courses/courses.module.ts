import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CoursesController } from './courses.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
})
export class CoursesModule {}
