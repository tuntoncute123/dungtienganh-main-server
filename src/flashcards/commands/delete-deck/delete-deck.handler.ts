import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteDeckCommand } from './delete-deck.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(DeleteDeckCommand)
export class DeleteDeckHandler implements ICommandHandler<DeleteDeckCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: DeleteDeckCommand) {
    if (!command.id) throw new BadRequestException('ID query parameter is required');
    await this.prisma.flashcardDeck.delete({ where: { id: command.id } });
    await this.redis.del('flashcards:all', `flashcards:${command.id}`);
    return { success: true, message: 'Flashcard deck deleted successfully' };
  }
}

