import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MarkNotificationReadCommand } from './mark-read.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler implements ICommandHandler<MarkNotificationReadCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: MarkNotificationReadCommand) {
    const { id, userId } = command;

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this notification');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
