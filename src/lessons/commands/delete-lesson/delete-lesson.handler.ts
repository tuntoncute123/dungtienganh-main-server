import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLessonCommand } from './delete-lesson.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(DeleteLessonCommand)
export class DeleteLessonHandler implements ICommandHandler<DeleteLessonCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: DeleteLessonCommand) {
    if (!command.id) throw new BadRequestException('ID is required');
    await this.prisma.lesson.delete({ where: { id: command.id } });
    await this.redis.del('lessons:all', `lessons:${command.id}`);
    return { success: true, message: 'Lesson deleted successfully' };
  }
}

