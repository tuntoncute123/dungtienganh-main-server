import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedDatabase() {
    console.log('Seeding database via API...');

    // 1. Seed Stories
    await this.prisma.story.deleteMany();
    const stories = [
      {
        id: "6a3b7b8742202c3bca448972",
        name: "Nguyễn hoàng Dũng",
        image: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/24/76312213.png",
        avatar: "/images/default-avatar.jpg",
      },
      {
        id: "6a3b796142202c3bca44896e",
        name: "Võ Như Ngọc",
        image: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/24/74745688.jpg",
      },
      {
        id: "6a3b65cc42202c3bca448963",
        name: "Nguyễn Lan Anh",
        image: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/24/79759717.png",
      },
      {
        id: "6a3a9c9e42202c3bca44890b",
        name: "Vi Thị Khánh Linh",
        image: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/23/42194668.png",
      },
      {
        id: "6a3a869142202c3bca4488e3",
        name: "Nguyễn Đình Gia Bảo",
        image: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/23/61568910.png",
      },
      {
        id: "6a3a2a2742202c3bca448833",
        name: "Thị Chang",
        image: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/23/13363843.jpg",
        avatar: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/21/1736486.webp",
      },
      {
        id: "6a3a1e0f42202c3bca448828",
        name: "Nguyễn Trần khánh an",
        image: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/23/39402039.jpg",
        avatar: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/21/56551914.jfif",
      },
      {
        id: "6a39480a42202c3bca4487c8",
        name: "Lê Anh Thư",
        image: "https://cdn.ngoaingu24h.vn/comaiphuong-edu-media/pro/2026/06/22/38837571.jpg",
      },
    ];

    for (const story of stories) {
      await this.prisma.story.create({ data: story });
    }

    // 2. Seed Lessons & Comments
    await this.prisma.comment.deleteMany();
    await this.prisma.lesson.deleteMany();

    const lesson1 = await this.prisma.lesson.create({
      data: {
        id: "1",
        title: "Từ loại (Lý thuyết - Buổi 1)",
        duration: "45:00",
        thumbnail: "/assets/1766474256-video_0360702d.png",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        playlistId: "playlist-grammar",
      },
    });

    const lesson2 = await this.prisma.lesson.create({
      data: {
        id: "3",
        title: "Từ loại (Lý thuyết - Buổi 2)",
        duration: "52:12",
        thumbnail: "/assets/1766474256-livestrea_3449e942.png",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        playlistId: "playlist-grammar",
      },
    });

    const comments = [
      {
        userName: "Nguyễn Bảo Trâm",
        content: "Làm sao để biết đó là danh từ vậy ạ, chẳng hạn như mechanic cô giảng ở trên cô nói là danh từ. Nhưng em không biết làm sao để phân biệt đó là danh từ ạ",
        lessonId: lesson1.id,
      },
      {
        userName: "Hoàng Thị Thu Thùy",
        content: "heritage vs heritage sites khác nhau như thế nào vậy ạ",
        lessonId: lesson1.id,
      },
      {
        userName: "Minh Hà",
        content: "ở 31:34 thì collection đổi thành complex được không ạ",
        lessonId: lesson2.id,
      },
    ];

    for (const comment of comments) {
      await this.prisma.comment.create({ data: comment });
    }

    // 3. Seed Flashcard Decks & Cards
    await this.prisma.flashcardCard.deleteMany();
    await this.prisma.flashcardDeck.deleteMany();

    const deck1 = await this.prisma.flashcardDeck.create({
      data: {
        id: "1",
        category: "vocabulary",
        categoryLabel: "Từ vựng",
        title: "TỪ VỰNG TIẾNG ANH THPTQG 2026 - CHỦ ĐỀ MÔI TRƯỜNG",
        cardCount: 5,
        isLocked: false,
        type: "system",
      },
    });

    const cards1 = [
      { front: "Accumulate (v)", back: "Tích lũy, gom góp lại" },
      { front: "Prevalent (adj)", back: "Phổ biến, thịnh hành" },
      { front: "Compensate (v)", back: "Đền bù, bồi thường, đền đáp" },
      { front: "Simultaneous (adj)", back: "Đồng thời, cùng một lúc" },
      { front: "Inevitably (adv)", back: "Chắc chắn xảy ra, không thể tránh khỏi" },
    ];

    for (const card of cards1) {
      await this.prisma.flashcardCard.create({
        data: {
          deckId: deck1.id,
          front: card.front,
          back: card.back,
        },
      });
    }

    const deck2 = await this.prisma.flashcardDeck.create({
      data: {
        id: "2",
        category: "vocabulary",
        categoryLabel: "Từ vựng",
        title: "TỪ VỰNG TIẾNG ANH THPTQG 2026 - CHỦ ĐỀ SỨC KHỎE",
        cardCount: 4,
        isLocked: false,
        type: "system",
      },
    });

    const cards2 = [
      { front: "Biodiversity (n)", back: "Đa dạng sinh học" },
      { front: "Conservation (n)", back: "Sự bảo tồn" },
      { front: "Vulnerable (adj)", back: "Dễ bị tổn thương, dễ gặp nguy hiểm" },
      { front: "Deforestation (n)", back: "Nạn phá rừng" },
    ];

    for (const card of cards2) {
      await this.prisma.flashcardCard.create({
        data: {
          deckId: deck2.id,
          front: card.front,
          back: card.back,
        },
      });
    }

    // 4. Seed Exams & Questions
    await this.prisma.question.deleteMany();
    await this.prisma.exam.deleteMany();

    const exam1 = await this.prisma.exam.create({
      data: {
        id: "so-ha-noi-2026",
        title: "Đề thi thử Tốt nghiệp THPT 2026 - Sở GD&ĐT Hà Nội (Lần 1)",
        category: "school-exams",
        duration: 60,
        cardCount: 3,
      },
    });

    const exam2 = await this.prisma.exam.create({
      data: {
        id: "progress-test-1",
        title: "Đề thi khảo sát chất lượng tháng 6 - TOEIC Part 5 & 6",
        category: "progress-test",
        duration: 45,
        cardCount: 2,
      },
    });

    const questions = [
      {
        examId: exam2.id,
        number: 1,
        text: "The free clinic was founded by a group of doctors to give _____ for various medical conditions.",
        options: { A: "treatment", B: "treat", C: "treated", D: "treating" },
        correctAnswer: "A",
        explanation: "Chọn danh từ 'treatment' (sự điều trị) làm tân ngữ cho động từ 'give'. Các phương án còn lại là động từ.",
      },
      {
        examId: exam2.id,
        number: 2,
        text: "The artist sent _____ best pieces to the gallery to be reviewed by the owner.",
        options: { A: "him", B: "himself", C: "his", D: "he" },
        correctAnswer: "C",
        explanation: "Chọn tính từ sở hữu 'his' để bổ nghĩa cho cụm danh từ 'best pieces'.",
      },
    ];

    for (const q of questions) {
      await this.prisma.question.create({
        data: {
          examId: q.examId,
          number: q.number,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        },
      });
    }

    // 5. Seed Users
    await this.prisma.user.deleteMany();
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const studentPassword = await bcrypt.hash("student123", salt);

    await this.prisma.user.create({
      data: {
        username: "admin",
        password: adminPassword,
        name: "Cô giáo Dung",
        role: "admin",
        allowedCourses: [],
        allowedExams: [],
      },
    });

    await this.prisma.user.create({
      data: {
        username: "student",
        password: studentPassword,
        name: "Nguyễn Văn Học Sinh",
        role: "student",
        allowedCourses: ["toan-9-he-2k12", "tieng-anh-9-he-2k12"],
        allowedExams: ["so-ha-noi-2026"],
      },
    });

    console.log('Seeding complete successfully via API!');
    return { success: true, message: 'Database seeded successfully!' };
  }
}
