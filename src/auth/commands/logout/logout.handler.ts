import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LogoutCommand } from './logout.command.js';
import { RedisService } from '../../../redis/redis.service.js';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(private readonly redis: RedisService) {}

  async execute(command: LogoutCommand) {
    const { token } = command;

    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'TEACHERDUNG_SECRET_KEY';
      const decoded = jwt.decode(token) as { exp?: number } | null;

      // Tính TTL còn lại của token (giây)
      const now = Math.floor(Date.now() / 1000);
      const exp = decoded?.exp || now + 3600;
      const remainingTtl = Math.max(exp - now, 1);

      // Hash token để làm key (tránh lưu raw token dài)
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const key = `blacklist:${tokenHash}`;

      await this.redis.set(key, '1', remainingTtl);
    } catch {
      // Nếu token không decode được, vẫn coi là logout thành công
    }

    return { success: true, message: 'Đăng xuất thành công' };
  }
}
