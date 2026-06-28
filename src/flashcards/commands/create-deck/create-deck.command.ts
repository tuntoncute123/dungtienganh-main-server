import { CreateDeckDto } from '../../dto/create-deck.dto.js';

export class CreateDeckCommand {
  constructor(public readonly dto: CreateDeckDto) {}
}
