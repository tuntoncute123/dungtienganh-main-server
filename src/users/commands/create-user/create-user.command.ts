import { CreateUserDto } from '../../dto/create-user.dto.js';

export class CreateUserCommand {
  constructor(public readonly dto: CreateUserDto) {}
}
