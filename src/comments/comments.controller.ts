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
import { CreateCommentCommand } from './commands/create-comment/create-comment.command.js';
import { UpdateCommentCommand } from './commands/update-comment/update-comment.command.js';
import { DeleteCommentCommand } from './commands/delete-comment/delete-comment.command.js';
import { GetCommentsQuery } from './queries/get-comments/get-comments.query.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

@Controller('api/comments')
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // GET /api/comments?id=xxx&lessonId=xxx
  @Get()
  async getComments(@Query('id') id?: string, @Query('lessonId') lessonId?: string) {
    return this.queryBus.execute(new GetCommentsQuery(id, lessonId));
  }

  // POST /api/comments
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createComment(@Body() dto: CreateCommentDto) {
    return this.commandBus.execute(new CreateCommentCommand(dto));
  }

  // PUT /api/comments
  @Put()
  async updateComment(@Body() dto: UpdateCommentDto) {
    return this.commandBus.execute(new UpdateCommentCommand(dto));
  }

  // DELETE /api/comments?id=xxx
  @Delete()
  async deleteComment(@Query('id') id: string) {
    return this.commandBus.execute(new DeleteCommentCommand(id));
  }
}
