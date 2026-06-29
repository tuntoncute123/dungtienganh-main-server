export class CreateUserDto {
  username: string;
  password: string;
  name: string;
  allowedCourses?: string[];
  allowedExams?: string[];
  targetOverall?: string;
  targetReading?: string;
  targetListening?: string;
  targetWriting?: string;
  targetSpeaking?: string;
  examDate?: string;
}
