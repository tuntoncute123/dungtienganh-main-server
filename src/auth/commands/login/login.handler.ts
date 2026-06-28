import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginCommand } from './login.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: LoginCommand) {
    const { username, password } = command.dto;

    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'TEACHERDUNG_SECRET_KEY';
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' },
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
}
