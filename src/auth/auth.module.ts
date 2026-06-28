import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { LoginHandler } from './commands/login/login.handler.js';
import { LogoutHandler } from './commands/logout/logout.handler.js';
import { GetMeHandler } from './queries/get-me/get-me.handler.js';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [AuthController],
  providers: [LoginHandler, LogoutHandler, GetMeHandler],
})
export class AuthModule {}

