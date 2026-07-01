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
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from './commands/create-user/create-user.command.js';
import { UpdateUserCommand } from './commands/update-user/update-user.command.js';
import { DeleteUserCommand } from './commands/delete-user/delete-user.command.js';
import { GetUsersQuery } from './queries/get-users/get-users.query.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtGuard } from '../common/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('api/users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // GET /api/users/profile — lấy thông tin profile của user hiện tại
  @Get('profile')
  @UseGuards(JwtGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.queryBus.execute(new GetUsersQuery(user.id));
  }

  // PUT /api/users/profile — học sinh tự cập nhật thông tin cá nhân (họ tên, mật khẩu)
  @Put('profile')
  @UseGuards(JwtGuard)
  async updateProfile(@CurrentUser() user: any, @Body() dto: any) {
    const updateDto = {
      ...dto,
      id: user.id, // Luôn ép buộc id là id của user đăng nhập
      allowedCourses: undefined, // Không cho phép tự đổi khóa học
      allowedExams: undefined,   // Không cho phép tự đổi đề thi
    };
    return this.commandBus.execute(new UpdateUserCommand(updateDto));
  }

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
