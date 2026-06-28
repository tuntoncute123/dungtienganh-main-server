import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteStoryCommand } from './delete-story.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(DeleteStoryCommand)
export class DeleteStoryHandler implements ICommandHandler<DeleteStoryCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: DeleteStoryCommand) {
    if (!command.id) throw new BadRequestException('ID is required');
    await this.prisma.story.delete({ where: { id: command.id } });
    await this.redis.del('stories:approved', 'stories:admin');
    return { success: true, message: 'Story deleted successfully' };
  }
}

