import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteExamCommand } from './delete-exam.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(DeleteExamCommand)
export class DeleteExamHandler implements ICommandHandler<DeleteExamCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: DeleteExamCommand) {
    if (!command.id) throw new BadRequestException('ID query parameter is required');
    await this.prisma.exam.delete({ where: { id: command.id } });
    await this.redis.del('exams:all', `exams:${command.id}`);
    return { success: true, message: 'Exam deleted successfully' };
  }
}

