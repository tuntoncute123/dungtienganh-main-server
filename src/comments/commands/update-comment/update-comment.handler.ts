import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentCommand } from './update-comment.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateCommentCommand) {
    const { id, userName, userAvatar, content, lessonId } = command.dto;
    if (!id) throw new BadRequestException('ID is required');
    return this.prisma.comment.update({
      where: { id },
      data: { userName, userAvatar, content, lessonId },
    });
  }
}
