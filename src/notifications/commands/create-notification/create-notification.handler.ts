import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateNotificationCommand } from './create-notification.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler implements ICommandHandler<CreateNotificationCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateNotificationCommand) {
    const { title, content, type = 'info', userId } = command.dto;

    if (!title || !content) {
      throw new BadRequestException('Title and content are required');
    }

    if (!userId || userId === 'all') {
      // Gửi cho tất cả học sinh
      const students = await this.prisma.user.findMany({
        where: { role: 'student' },
        select: { id: true },
      });

      if (students.length === 0) {
        return { success: true, count: 0 };
      }

      const data = students.map((student) => ({
        userId: student.id,
        title,
        content,
        type,
      }));

      await this.prisma.notification.createMany({
        data,
      });

      return { success: true, count: students.length };
    } else {
      // Gửi cho 1 học sinh cụ thể
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const notification = await this.prisma.notification.create({
        data: {
          userId,
          title,
          content,
          type,
        },
      });

      return notification;
    }
  }
}
