import { UpdateCommentDto } from '../../dto/update-comment.dto.js';

export class UpdateCommentCommand {
  constructor(public readonly dto: UpdateCommentDto) {}
}
