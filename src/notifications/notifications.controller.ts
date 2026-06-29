import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtGuard } from '../common/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { CreateNotificationCommand } from './commands/create-notification/create-notification.command.js';
import { MarkNotificationReadCommand } from './commands/mark-read/mark-read.command.js';
import { DeleteNotificationCommand } from './commands/delete-notification/delete-notification.command.js';
import { GetNotificationsQuery } from './queries/get-notifications/get-notifications.query.js';

@Controller('api/notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // GET /api/notifications
  @Get()
  async getNotifications(@CurrentUser() user: any) {
    return this.queryBus.execute(new GetNotificationsQuery(user.id));
  }

  // POST /api/notifications (Admin only)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNotification(
    @CurrentUser() user: any,
    @Body() dto: CreateNotificationDto,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admin can send notifications');
    }
    return this.commandBus.execute(new CreateNotificationCommand(dto));
  }

  // PUT /api/notifications/read?id=xxx
  @Put('read')
  async markAsRead(
    @CurrentUser() user: any,
    @Query('id') id: string,
  ) {
    return this.commandBus.execute(new MarkNotificationReadCommand(id, user.id));
  }

  // DELETE /api/notifications?id=xxx
  @Delete()
  async deleteNotification(
    @CurrentUser() user: any,
    @Query('id') id: string,
  ) {
    return this.commandBus.execute(new DeleteNotificationCommand(id, user.id));
  }
}
