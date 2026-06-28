import { CreateExamDto } from '../../dto/create-exam.dto.js';

export class CreateExamCommand {
  constructor(public readonly dto: CreateExamDto) {}
}
