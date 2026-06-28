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
import { CreateUserCommand } from './commands/create-user/create-user.command.js';
import { UpdateUserCommand } from './commands/update-user/update-user.command.js';
import { DeleteUserCommand } from './commands/delete-user/delete-user.command.js';
import { GetUsersQuery } from './queries/get-users/get-users.query.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Controller('api/users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // GET /api/users — danh sách học sinh
  @Get()
  async getStudents() {
    return this.queryBus.execute(new GetUsersQuery());
  }

  // POST /api/users — tạo học sinh mới
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStudent(@Body() dto: CreateUserDto) {
    return this.commandBus.execute(new CreateUserCommand(dto));
  }

  // PUT /api/users — cập nhật học sinh
  @Put()
  async updateStudent(@Body() dto: UpdateUserDto) {
    return this.commandBus.execute(new UpdateUserCommand(dto));
  }

  // DELETE /api/users?id=xxx — xoá học sinh
  @Delete()
  async deleteStudent(@Query('id') id: string) {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }
}
