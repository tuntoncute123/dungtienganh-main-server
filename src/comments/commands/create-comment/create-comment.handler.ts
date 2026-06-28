import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentCommand } from './create-comment.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler implements ICommandHandler<CreateCommentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateCommentCommand) {
    const { userName, userAvatar, content, lessonId } = command.dto;
    if (!userName || !content) throw new BadRequestException('UserName and content are required');
    return this.prisma.comment.create({
      data: { userName, userAvatar: userAvatar || null, content, lessonId: lessonId || null },
    });
  }
}
