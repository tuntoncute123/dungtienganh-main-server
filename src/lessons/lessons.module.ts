import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LessonsController } from './lessons.controller.js';
import { CreateLessonHandler } from './commands/create-lesson/create-lesson.handler.js';
import { UpdateLessonHandler } from './commands/update-lesson/update-lesson.handler.js';
import { DeleteLessonHandler } from './commands/delete-lesson/delete-lesson.handler.js';
import { GetLessonsHandler } from './queries/get-lessons/get-lessons.handler.js';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [LessonsController],
  providers: [CreateLessonHandler, UpdateLessonHandler, DeleteLessonHandler, GetLessonsHandler],
})
export class LessonsModule {}
