import { Controller, Get, Post, Put, Delete, Body, Query, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/flashcards')
export class FlashcardsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getDecks(@Query('id') id?: string) {
    if (id) {
      const deck = await this.prisma.flashcardDeck.findUnique({
        where: { id },
        include: { cards: true },
      });
      if (!deck) {
        throw new NotFoundException('Flashcard deck not found');
      }
      return deck;
    }
    return this.prisma.flashcardDeck.findMany({
      orderBy: { createdAt: 'desc' },
      include: { cards: true },
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDeck(@Body() body: { category: string; categoryLabel?: string; title: string; isLocked?: boolean; type?: string; cards?: Array<{ front: string; back: string }> }) {
    const { category, categoryLabel, title, isLocked, type, cards } = body;
    if (!category || !title) {
      throw new BadRequestException('Category and title are required');
    }

    const cardList = Array.isArray(cards) ? cards : [];

    return this.prisma.flashcardDeck.create({
      data: {
        category,
        categoryLabel: categoryLabel || category,
        title,
        isLocked: !!isLocked,
        type: type || 'custom',
        cardCount: cardList.length,
        cards: {
          create: cardList.map((card) => ({
            front: card.front || '',
            back: card.back || '',
          })),
        },
      },
      include: { cards: true },
    });
  }

  @Put()
  async updateDeck(@Body() body: { id: string; category?: string; categoryLabel?: string; title?: string; isLocked?: boolean; type?: string; cards?: Array<{ front: string; back: string }> }) {
    const { id, category, categoryLabel, title, isLocked, type, cards } = body;
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    const hasCards = Array.isArray(cards);

    if (hasCards) {
      // Clear existing cards
      await this.prisma.flashcardCard.deleteMany({
        where: { deckId: id },
      });
    }

    return this.prisma.flashcardDeck.update({
      where: { id },
      data: {
        category,
        categoryLabel,
        title,
        isLocked: isLocked !== undefined ? !!isLocked : undefined,
        type,
        cardCount: hasCards ? cards.length : undefined,
        ...(hasCards && {
          cards: {
            create: cards.map((card) => ({
              front: card.front || '',
              back: card.back || '',
            })),
          },
        }),
      },
      include: { cards: true },
    });
  }

  @Delete()
  async deleteDeck(@Query('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID query parameter is required');
    }
    await this.prisma.flashcardDeck.delete({ where: { id } });
    return { success: true, message: 'Flashcard deck deleted successfully' };
  }
}
