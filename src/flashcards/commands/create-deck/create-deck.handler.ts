import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateDeckCommand } from './create-deck.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateDeckCommand)
export class CreateDeckHandler implements ICommandHandler<CreateDeckCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateDeckCommand) {
    const { category, categoryLabel, title, isLocked, type, cards } = command.dto;
    if (!category || !title) throw new BadRequestException('Category and title are required');

    const cardList = Array.isArray(cards) ? cards : [];
    return this.prisma.flashcardDeck.create({
      data: {
        category,
        categoryLabel: categoryLabel || category,
        title,
        isLocked: !!isLocked,
        type: type || 'custom',
        cardCount: cardList.length,
        cards: { create: cardList.map((c) => ({ front: c.front || '', back: c.back || '' })) },
      },
      include: { cards: true },
    });
  }
}
