import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateStoryCommand } from './create-story.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateStoryCommand)
export class CreateStoryHandler implements ICommandHandler<CreateStoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateStoryCommand) {
    const { name, image, avatar, type, isApproved } = command.dto;
    if (!name || !image) throw new BadRequestException('Name and image are required');

    let approved = false;
    if (type === 'badge' || type === 'post') {
      approved = true;
    } else if (isApproved !== undefined) {
      approved = isApproved;
    }

    return this.prisma.story.create({
      data: {
        name,
        image,
        avatar: avatar || null,
        type: type || 'upload',
        isApproved: approved,
      },
    });
  }
}
