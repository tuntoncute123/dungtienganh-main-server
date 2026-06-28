import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteStoryCommand } from './delete-story.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(DeleteStoryCommand)
export class DeleteStoryHandler implements ICommandHandler<DeleteStoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteStoryCommand) {
    if (!command.id) throw new BadRequestException('ID is required');
    await this.prisma.story.delete({ where: { id: command.id } });
    return { success: true, message: 'Story deleted successfully' };
  }
}
