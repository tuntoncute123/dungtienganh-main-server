import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserCommand } from './update-user.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateUserCommand) {
    const { id, name, password, allowedCourses, allowedExams } = command.dto;

    if (!id) throw new BadRequestException('User ID is required');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Học sinh không tồn tại');

    let hashedPassword: string | undefined;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name,
        password: hashedPassword,
        allowedCourses: allowedCourses !== undefined ? allowedCourses : undefined,
        allowedExams: allowedExams !== undefined ? allowedExams : undefined,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        allowedCourses: true,
        allowedExams: true,
        createdAt: true,
      },
    });
  }
}
