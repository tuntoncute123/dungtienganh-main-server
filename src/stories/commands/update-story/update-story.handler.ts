import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateStoryCommand } from './update-story.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateStoryCommand)
export class UpdateStoryHandler implements ICommandHandler<UpdateStoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateStoryCommand) {
    const { id, name, image, avatar, type, isApproved } = command.dto;
    if (!id) throw new BadRequestException('ID is required');
    return this.prisma.story.update({
      where: { id },
      data: { name, image, avatar, type, isApproved },
    });
  }
}
