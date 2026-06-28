-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "exerciseId" TEXT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'upload';
