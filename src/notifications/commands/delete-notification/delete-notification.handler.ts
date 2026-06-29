import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteNotificationCommand } from './delete-notification.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

@CommandHandler(DeleteNotificationCommand)
export class DeleteNotificationHandler implements ICommandHandler<DeleteNotificationCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteNotificationCommand) {
    const { id, userId } = command;

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this notification');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { success: true };
  }
}
