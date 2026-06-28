import { UpdateLessonDto } from '../../dto/update-lesson.dto.js';

export class UpdateLessonCommand {
  constructor(public readonly dto: UpdateLessonDto) {}
}
