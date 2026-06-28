import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.split(' ')[1];
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'TEACHERDUNG_SECRET_KEY';
      const decoded = jwt.verify(token, JWT_SECRET);

      // Kiểm tra token có trong blacklist không
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const isBlacklisted = await this.redis.exists(`blacklist:${tokenHash}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token đã bị thu hồi, vui lòng đăng nhập lại');
      }

      request.user = decoded;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid token');
    }
  }
}

