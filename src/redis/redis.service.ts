import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit() {
    const retryStrategy = (times: number) => {
      if (times > 3) {
        this.logger.warn('Redis connection failed, caching disabled');
        return null; // stop retrying
      }
      return Math.min(times * 200, 1000);
    };

    const redisUrl = process.env.REDIS_URL;
    const useTls = process.env.REDIS_TLS === 'true' || redisUrl?.startsWith('rediss://');

    const options: any = {
      retryStrategy,
      lazyConnect: true,
    };

    if (useTls) {
      options.tls = {
        rejectUnauthorized: false,
      };
    }

    if (redisUrl) {
      this.client = new Redis(redisUrl, options);
    } else {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        ...options,
      });
    }

    this.client.on('connect', () => this.logger.log('Redis connected ✅'));
    this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));

    this.client.connect().catch(() => {});
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // silently fail — Redis is optional
    }
  }

  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) await this.client.del(...keys);
    } catch {
      // silently fail
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    } catch {
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch {
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch {
      // silently fail
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch {
      return -1;
    }
  }
}
