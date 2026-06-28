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
import { CreateStoryCommand } from './commands/create-story/create-story.command.js';
import { UpdateStoryCommand } from './commands/update-story/update-story.command.js';
import { DeleteStoryCommand } from './commands/delete-story/delete-story.command.js';
import { GetStoriesQuery } from './queries/get-stories/get-stories.query.js';
import { CreateStoryDto } from './dto/create-story.dto.js';
import { UpdateStoryDto } from './dto/update-story.dto.js';

@Controller('api/stories')
export class StoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // GET /api/stories?id=xxx&admin=true
  @Get()
  async getStories(@Query('id') id?: string, @Query('admin') admin?: string) {
    return this.queryBus.execute(new GetStoriesQuery(id, admin));
  }

  // POST /api/stories
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStory(@Body() dto: CreateStoryDto) {
    return this.commandBus.execute(new CreateStoryCommand(dto));
  }

  // PUT /api/stories
  @Put()
  async updateStory(@Body() dto: UpdateStoryDto) {
    return this.commandBus.execute(new UpdateStoryCommand(dto));
  }

  // DELETE /api/stories?id=xxx
  @Delete()
  async deleteStory(@Query('id') id: string) {
    return this.commandBus.execute(new DeleteStoryCommand(id));
  }
}
