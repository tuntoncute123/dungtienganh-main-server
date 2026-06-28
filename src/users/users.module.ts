import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersController } from './users.controller.js';
import { CreateUserHandler } from './commands/create-user/create-user.handler.js';
import { UpdateUserHandler } from './commands/update-user/update-user.handler.js';
import { DeleteUserHandler } from './commands/delete-user/delete-user.handler.js';
import { GetUsersHandler } from './queries/get-users/get-users.handler.js';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [UsersController],
  providers: [CreateUserHandler, UpdateUserHandler, DeleteUserHandler, GetUsersHandler],
})
export class UsersModule {}
