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
import { CreateLessonCommand } from './commands/create-lesson/create-lesson.command.js';
import { UpdateLessonCommand } from './commands/update-lesson/update-lesson.command.js';
import { DeleteLessonCommand } from './commands/delete-lesson/delete-lesson.command.js';
import { GetLessonsQuery } from './queries/get-lessons/get-lessons.query.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { UpdateLessonDto } from './dto/update-lesson.dto.js';

@Controller('api/lessons')
export class LessonsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // GET /api/lessons?id=xxx&playlistId=yyy
  @Get()
  async getLessons(
    @Query('id') id?: string,
    @Query('playlistId') playlistId?: string,
  ) {
    return this.queryBus.execute(new GetLessonsQuery(id, playlistId));
  }

  // POST /api/lessons
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.commandBus.execute(new CreateLessonCommand(dto));
  }

  // PUT /api/lessons
  @Put()
  async updateLesson(@Body() dto: UpdateLessonDto) {
    return this.commandBus.execute(new UpdateLessonCommand(dto));
  }

  // DELETE /api/lessons?id=xxx
  @Delete()
  async deleteLesson(@Query('id') id: string) {
    return this.commandBus.execute(new DeleteLessonCommand(id));
  }
}
