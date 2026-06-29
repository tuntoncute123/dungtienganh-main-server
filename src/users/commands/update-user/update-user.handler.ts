import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserCommand } from './update-user.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateUserCommand) {
    const {
      id,
      username,
      name,
      password,
      allowedCourses,
      allowedExams,
      targetOverall,
      targetReading,
      targetListening,
      targetWriting,
      targetSpeaking,
      examDate,
    } = command.dto;

    if (!id) throw new BadRequestException('User ID is required');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Học sinh không tồn tại');

    // Check username conflict if it changes
    if (username && username !== user.username) {
      const existing = await this.prisma.user.findUnique({ where: { username } });
      if (existing) {
        throw new BadRequestException('Tên đăng nhập đã tồn tại trong hệ thống');
      }
    }

    let hashedPassword: string | undefined;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        username: username !== undefined ? username : undefined,
        name,
        password: hashedPassword,
        plainPassword: password !== undefined ? password : undefined,
        allowedCourses: allowedCourses !== undefined ? allowedCourses : undefined,
        allowedExams: allowedExams !== undefined ? allowedExams : undefined,
        targetOverall: targetOverall !== undefined ? targetOverall : undefined,
        targetReading: targetReading !== undefined ? targetReading : undefined,
        targetListening: targetListening !== undefined ? targetListening : undefined,
        targetWriting: targetWriting !== undefined ? targetWriting : undefined,
        targetSpeaking: targetSpeaking !== undefined ? targetSpeaking : undefined,
        examDate: examDate !== undefined ? examDate : undefined,
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
