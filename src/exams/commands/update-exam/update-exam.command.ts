import { UpdateExamDto } from '../../dto/update-exam.dto.js';

export class UpdateExamCommand {
  constructor(public readonly dto: UpdateExamDto) {}
}
