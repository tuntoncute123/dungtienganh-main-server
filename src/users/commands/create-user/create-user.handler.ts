import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateUserCommand) {
    const {
      username,
      password,
      name,
      allowedCourses,
      allowedExams,
      targetOverall,
      targetReading,
      targetListening,
      targetWriting,
      targetSpeaking,
      examDate,
    } = command.dto;

    if (!username || !password || !name) {
      throw new BadRequestException('Username, password and name are required');
    }

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại trong hệ thống');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        plainPassword: password,
        name,
        role: 'student',
        allowedCourses: allowedCourses || [],
        allowedExams: allowedExams || [],
        targetOverall: targetOverall || '',
        targetReading: targetReading || '',
        targetListening: targetListening || '',
        targetWriting: targetWriting || '',
        targetSpeaking: targetSpeaking || '',
        examDate: examDate || '',
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        allowedCourses: true,
        allowedExams: true,
        plainPassword: true,
        targetOverall: true,
        targetReading: true,
        targetListening: true,
        targetWriting: true,
        targetSpeaking: true,
        examDate: true,
        createdAt: true,
      },
    });
  }
}
