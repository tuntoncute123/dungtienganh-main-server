import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserCommand } from './delete-user.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteUserCommand) {
    const { id } = command;
    if (!id) throw new BadRequestException('User ID is required');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Học sinh không tồn tại');

    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: 'Đã xóa tài khoản học sinh thành công' };
  }
}
