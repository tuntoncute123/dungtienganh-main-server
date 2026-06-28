import { UpdateStoryDto } from '../../dto/update-story.dto.js';

export class UpdateStoryCommand {
  constructor(public readonly dto: UpdateStoryDto) {}
}
