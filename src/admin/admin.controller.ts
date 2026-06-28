import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { SeedDatabaseCommand } from './commands/seed-database/seed-database.command.js';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedDatabase() {
    return this.commandBus.execute(new SeedDatabaseCommand());
  }
}
