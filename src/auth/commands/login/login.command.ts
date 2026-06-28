import { LoginDto } from '../../dto/login.dto.js';

export class LoginCommand {
  constructor(public readonly dto: LoginDto) {}
}
