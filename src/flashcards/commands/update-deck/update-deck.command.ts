import { UpdateDeckDto } from '../../dto/update-deck.dto.js';

export class UpdateDeckCommand {
  constructor(public readonly dto: UpdateDeckDto) {}
}
