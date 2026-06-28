import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateStoryCommand } from './create-story.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateStoryCommand)
export class CreateStoryHandler implements ICommandHandler<CreateStoryCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: CreateStoryCommand) {
    const { name, image, avatar, type, isApproved } = command.dto;
    if (!name || !image) throw new BadRequestException('Name and image are required');

    let approved = false;
    if (type === 'badge' || type === 'post') {
      approved = true;
    } else if (isApproved !== undefined) {
      approved = isApproved;
    }

    const story = await this.prisma.story.create({
      data: {
        name,
        image,
        avatar: avatar || null,
        type: type || 'upload',
        isApproved: approved,
      },
    });
    await this.redis.del('stories:approved', 'stories:admin');
    return story;
  }
}

