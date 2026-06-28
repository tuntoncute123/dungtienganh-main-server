import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateExamCommand } from './create-exam.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateExamCommand)
export class CreateExamHandler implements ICommandHandler<CreateExamCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: CreateExamCommand) {
    const { title, category, duration, questions } = command.dto;
    if (!title || !category || !duration) {
      throw new BadRequestException('Title, category and duration are required');
    }

    const questionList = Array.isArray(questions) ? questions : [];

    const exam = await this.prisma.exam.create({
      data: {
        title,
        category,
        duration: parseInt(duration as any) || 60,
        cardCount: questionList.length,
        questions: {
          create: questionList.map((q) => ({
            number: parseInt(q.number as any) || 1,
            text: q.text || '',
            options: q.options || {},
            correctAnswer: q.correctAnswer || 'A',
            explanation: q.explanation || null,
          })),
        },
      },
      include: { questions: true },
    });
    await this.redis.del('exams:all', `exams:category:${category}`);
    return exam;
  }
}

