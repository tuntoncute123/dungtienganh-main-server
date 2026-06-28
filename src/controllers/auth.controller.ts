import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'TEACHERDUNG_SECRET_KEY';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username?: string; password?: string }) {
    const { username, password } = body;
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        allowedCourses: user.allowedCourses || [],
        allowedExams: user.allowedExams || [],
      },
    };
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        allowedCourses: user.allowedCourses || [],
        allowedExams: user.allowedExams || [],
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
