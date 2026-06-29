import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetNotificationsQuery } from './get-notifications.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@QueryHandler(GetNotificationsQuery)
export class GetNotificationsHandler implements IQueryHandler<GetNotificationsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetNotificationsQuery) {
    const { userId } = query;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const isAdmin = user?.role === 'admin';

    const [list, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: isAdmin ? {} : { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              username: true,
            },
          },
        },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      list,
      unreadCount,
    };
  }
}
