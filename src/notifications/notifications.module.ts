import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationsController } from './notifications.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../redis/redis.module.js';

import { CreateNotificationHandler } from './commands/create-notification/create-notification.handler.js';
import { MarkNotificationReadHandler } from './commands/mark-read/mark-read.handler.js';
import { DeleteNotificationHandler } from './commands/delete-notification/delete-notification.handler.js';
import { GetNotificationsHandler } from './queries/get-notifications/get-notifications.handler.js';

const CommandHandlers = [
  CreateNotificationHandler,
  MarkNotificationReadHandler,
  DeleteNotificationHandler,
];

const QueryHandlers = [
  GetNotificationsHandler,
];

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    RedisModule,
  ],
  controllers: [NotificationsController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class NotificationsModule {}
