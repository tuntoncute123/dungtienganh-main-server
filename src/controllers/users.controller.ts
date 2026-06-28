import { Controller, Get, Post, Put, Delete, Body, Query, HttpCode, HttpStatus, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('api/users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('all-debug')
  async getAllDebug() {
    return this.prisma.user.findMany();
  }

  @Get()
  async getStudents() {
    // Chỉ trả về các user có role là student để hiển thị quản lý học sinh
    const users = await this.prisma.user.findMany({
      where: { role: 'student' },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      allowedCourses: user.allowedCourses || [],
      allowedExams: user.allowedExams || [],
      createdAt: user.createdAt,
    }));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStudent(@Body() body: { username?: string; password?: string; name?: string; allowedCourses?: string[]; allowedExams?: string[] }) {
    const { username, password, name, allowedCourses, allowedExams } = body;
    if (!username || !password || !name) {
      throw new BadRequestException('Username, password and name are required');
    }

    // Check if username already exists
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existing) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại trong hệ thống');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: 'student',
        allowedCourses: allowedCourses || [],
        allowedExams: allowedExams || [],
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        allowedCourses: true,
        allowedExams: true,
        createdAt: true,
      }
    });
  }

  @Put()
  async updateStudent(@Body() body: { id: string; name?: string; password?: string; allowedCourses?: string[]; allowedExams?: string[] }) {
    const { id, name, password, allowedCourses, allowedExams } = body;
    if (!id) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('Học sinh không tồn tại');
    }

    let hashedPassword: string | undefined = undefined;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name,
        password: hashedPassword,
        allowedCourses: allowedCourses !== undefined ? allowedCourses : undefined,
        allowedExams: allowedExams !== undefined ? allowedExams : undefined,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        allowedCourses: true,
        allowedExams: true,
        createdAt: true,
      }
    });
  }

  @Delete()
  async deleteStudent(@Query('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID query parameter is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('Học sinh không tồn tại');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xóa tài khoản học sinh thành công' };
  }
}
