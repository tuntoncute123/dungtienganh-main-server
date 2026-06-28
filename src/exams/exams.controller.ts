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
import { CreateExamCommand } from './commands/create-exam/create-exam.command.js';
import { UpdateExamCommand } from './commands/update-exam/update-exam.command.js';
import { DeleteExamCommand } from './commands/delete-exam/delete-exam.command.js';
import { GetExamsQuery } from './queries/get-exams/get-exams.query.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';

@Controller('api/exams')
export class ExamsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // GET /api/exams?id=xxx&category=xxx
  @Get()
  async getExams(@Query('id') id?: string, @Query('category') category?: string) {
    return this.queryBus.execute(new GetExamsQuery(id, category));
  }

  // POST /api/exams
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExam(@Body() dto: CreateExamDto) {
    return this.commandBus.execute(new CreateExamCommand(dto));
  }

  // PUT /api/exams
  @Put()
  async updateExam(@Body() dto: UpdateExamDto) {
    return this.commandBus.execute(new UpdateExamCommand(dto));
  }

  // DELETE /api/exams?id=xxx
  @Delete()
  async deleteExam(@Query('id') id: string) {
    return this.commandBus.execute(new DeleteExamCommand(id));
  }
}
