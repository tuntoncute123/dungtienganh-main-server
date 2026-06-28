import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateExamCommand } from './update-exam.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateExamCommand)
export class UpdateExamHandler implements ICommandHandler<UpdateExamCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: UpdateExamCommand) {
    const { id, title, category, duration, questions } = command.dto;
    if (!id) throw new BadRequestException('ID is required');

    const hasQuestions = Array.isArray(questions);

    if (hasQuestions) {
      // Clear current questions
      await this.prisma.question.deleteMany({
        where: { examId: id },
      });
    }

    const exam = await this.prisma.exam.update({
      where: { id },
      data: {
        title,
        category,
        duration: duration !== undefined ? parseInt(duration as any) : undefined,
        cardCount: hasQuestions ? questions.length : undefined,
        ...(hasQuestions && {
          questions: {
            create: questions.map((q) => ({
              number: parseInt(q.number as any) || 1,
              text: q.text || '',
              options: q.options || {},
              correctAnswer: q.correctAnswer || 'A',
              explanation: q.explanation || null,
            })),
          },
        }),
      },
      include: { questions: true },
    });
    await this.redis.del('exams:all', `exams:${id}`, category ? `exams:category:${category}` : '');
    return exam;
  }
}

