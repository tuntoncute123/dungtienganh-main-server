export class CreateUserDto {
  username: string;
  password: string;
  name: string;
  allowedCourses?: string[];
  allowedExams?: string[];
}
