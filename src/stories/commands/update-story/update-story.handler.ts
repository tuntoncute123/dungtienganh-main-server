import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateStoryCommand } from './update-story.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateStoryCommand)
export class UpdateStoryHandler implements ICommandHandler<UpdateStoryCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: UpdateStoryCommand) {
    const { id, name, image, avatar, type, isApproved } = command.dto;
    if (!id) throw new BadRequestException('ID is required');
    const story = await this.prisma.story.update({
      where: { id },
      data: { name, image, avatar, type, isApproved },
    });
    await this.redis.del('stories:approved', 'stories:admin');
    return story;
  }
}

