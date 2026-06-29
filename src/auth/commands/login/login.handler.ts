import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginCommand } from './login.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { UnauthorizedException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const MAX_ATTEMPTS = 5;
const BLOCK_TTL = 15 * 60; // 15 phút

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: LoginCommand) {
    const { username, password } = command.dto;

    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    const rateLimitKey = `rate_limit:login:${username}`;

    // Kiểm tra số lần đăng nhập sai
    const attempts = parseInt((await this.redis.get(rateLimitKey)) || '0', 10);
    if (attempts >= MAX_ATTEMPTS) {
      const remaining = await this.redis.ttl(rateLimitKey);
      throw new HttpException(
        `Tài khoản bị tạm khóa do đăng nhập sai nhiều lần. Thử lại sau ${Math.ceil(remaining / 60)} phút.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      await this.incrementLoginAttempts(rateLimitKey, attempts);
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await this.incrementLoginAttempts(rateLimitKey, attempts);
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    // Đăng nhập thành công — reset counter
    await this.redis.del(rateLimitKey);

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
        targetOverall: user.targetOverall || '',
        targetReading: user.targetReading || '',
        targetListening: user.targetListening || '',
        targetWriting: user.targetWriting || '',
        targetSpeaking: user.targetSpeaking || '',
        examDate: user.examDate || '',
      },
    };
  }

  private async incrementLoginAttempts(key: string, current: number) {
    const newCount = await this.redis.incr(key);
    if (newCount === 1) {
      // Lần đầu tiên sai — set TTL 15 phút
      await this.redis.expire(key, BLOCK_TTL);
    }
  }
}

