import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetMeQuery } from './get-me.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetMeQuery) {
    const JWT_SECRET = process.env.JWT_SECRET || 'TEACHERDUNG_SECRET_KEY';
    try {
      const decoded = jwt.verify(query.token, JWT_SECRET) as {
        id: string;
        username: string;
        role: string;
      };
      const user = await this.prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        allowedCourses: user.allowedCourses || [],
        allowedExams: user.allowedExams || [],
      };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
