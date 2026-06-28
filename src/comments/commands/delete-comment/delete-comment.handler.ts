import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCommentCommand } from './delete-comment.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteCommentCommand) {
    if (!command.id) throw new BadRequestException('ID is required');
    await this.prisma.comment.delete({ where: { id: command.id } });
    return { success: true, message: 'Comment deleted successfully' };
  }
}
