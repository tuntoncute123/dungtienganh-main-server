import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDeckCommand } from './commands/create-deck/create-deck.command.js';
import { UpdateDeckCommand } from './commands/update-deck/update-deck.command.js';
import { DeleteDeckCommand } from './commands/delete-deck/delete-deck.command.js';
import { GetDecksQuery } from './queries/get-decks/get-decks.query.js';
import { CreateDeckDto } from './dto/create-deck.dto.js';
import { UpdateDeckDto } from './dto/update-deck.dto.js';

@Controller('api/flashcards')
export class FlashcardsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // GET /api/flashcards?id=xxx
  @Get()
  async getDecks(@Query('id') id?: string) {
    return this.queryBus.execute(new GetDecksQuery(id));
  }

  // POST /api/flashcards
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDeck(@Body() dto: CreateDeckDto) {
    return this.commandBus.execute(new CreateDeckCommand(dto));
  }

  // PUT /api/flashcards
  @Put()
  async updateDeck(@Body() dto: UpdateDeckDto) {
    return this.commandBus.execute(new UpdateDeckCommand(dto));
  }

  // DELETE /api/flashcards?id=xxx
  @Delete()
  async deleteDeck(@Query('id') id: string) {
    return this.commandBus.execute(new DeleteDeckCommand(id));
  }
}
