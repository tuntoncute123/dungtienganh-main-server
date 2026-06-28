import { CreateStoryDto } from '../../dto/create-story.dto.js';

export class CreateStoryCommand {
  constructor(public readonly dto: CreateStoryDto) {}
}
