import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetUsersQuery } from './get-users.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const users = await this.prisma.user.findMany({
      where: { role: 'student' },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      allowedCourses: user.allowedCourses || [],
      allowedExams: user.allowedExams || [],
      plainPassword: user.plainPassword || '',
      createdAt: user.createdAt,
    }));
  }
}
