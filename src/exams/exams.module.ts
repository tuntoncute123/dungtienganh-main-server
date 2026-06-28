import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ExamsController } from './exams.controller.js';
import { CreateExamHandler } from './commands/create-exam/create-exam.handler.js';
import { UpdateExamHandler } from './commands/update-exam/update-exam.handler.js';
import { DeleteExamHandler } from './commands/delete-exam/delete-exam.handler.js';
import { GetExamsHandler } from './queries/get-exams/get-exams.handler.js';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [ExamsController],
  providers: [
    CreateExamHandler,
    UpdateExamHandler,
    DeleteExamHandler,
    GetExamsHandler,
  ],
})
export class ExamsModule {}
