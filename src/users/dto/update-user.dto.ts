export class UpdateUserDto {
  id: string;
  username?: string;
  name?: string;
  password?: string;
  allowedCourses?: string[];
  allowedExams?: string[];
  targetOverall?: string;
  targetReading?: string;
  targetListening?: string;
  targetWriting?: string;
  targetSpeaking?: string;
  examDate?: string;
}
