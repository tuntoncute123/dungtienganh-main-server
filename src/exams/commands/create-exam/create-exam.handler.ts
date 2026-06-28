import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateExamCommand } from './create-exam.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateExamCommand)
export class CreateExamHandler implements ICommandHandler<CreateExamCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateExamCommand) {
    const { title, category, duration, questions } = command.dto;
    if (!title || !category || !duration) {
      throw new BadRequestException('Title, category and duration are required');
    }

    const questionList = Array.isArray(questions) ? questions : [];

    return this.prisma.exam.create({
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
  }
}
