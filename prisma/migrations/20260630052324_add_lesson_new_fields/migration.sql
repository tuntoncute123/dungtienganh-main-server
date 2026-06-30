-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "documents" JSONB,
ADD COLUMN     "homeworkTasks" JSONB,
ADD COLUMN     "quizPoints" JSONB;
