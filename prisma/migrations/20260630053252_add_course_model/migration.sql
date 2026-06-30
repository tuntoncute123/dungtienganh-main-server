-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT,
    "teachers" JSONB,
    "videos" TEXT,
    "exercises" TEXT,
    "exams" TEXT,
    "priceMain" TEXT,
    "priceSale" TEXT,
    "saleTag" TEXT,
    "grade" TEXT NOT NULL,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "hotIcon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- Insert default course for existing lessons before creating foreign key
INSERT INTO "Course" ("id", "title", "grade") VALUES ('playlist-grammar', 'Ngữ pháp Ứng dụng', '9');

-- Cập nhật trường teachers của Course mẫu
UPDATE "Course" SET "teachers" = '["Tổ Tiếng Anh"]'::jsonb WHERE "id" = 'playlist-grammar';

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
