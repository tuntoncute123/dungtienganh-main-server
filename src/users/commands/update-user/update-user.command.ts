import { UpdateUserDto } from '../../dto/update-user.dto.js';

export class UpdateUserCommand {
  constructor(public readonly dto: UpdateUserDto) {}
}
