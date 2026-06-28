import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FlashcardsController } from './flashcards.controller.js';
import { CreateDeckHandler } from './commands/create-deck/create-deck.handler.js';
import { UpdateDeckHandler } from './commands/update-deck/update-deck.handler.js';
import { DeleteDeckHandler } from './commands/delete-deck/delete-deck.handler.js';
import { GetDecksHandler } from './queries/get-decks/get-decks.handler.js';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [FlashcardsController],
  providers: [
    CreateDeckHandler,
    UpdateDeckHandler,
    DeleteDeckHandler,
    GetDecksHandler,
  ],
})
export class FlashcardsModule {}
