import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import Redis from "ioredis";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing Redis cache...");
  try {
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    await redis.flushall();
    await redis.quit();
    console.log("Redis cache cleared!");
  } catch (e) {
    console.warn("Could not connect to Redis to clear cache:", e);
  }

  console.log("Seeding database...");

  // 1. Seed Stories
  await prisma.story.deleteMany();
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
    await prisma.story.create({ data: story });
  }
  console.log("Seeded Stories!");

  // 2. Seed Lessons & Comments
  await prisma.lesson.deleteMany();
  await prisma.comment.deleteMany();

  const QUIZ_POINTS = [
    { label: "Quiz 1 41:26", percent: 74.4 },
    { label: "Quiz 2 43:39", percent: 78.4 },
    { label: "Quiz 3 49:43", percent: 89.3 },
  ];

  const lesson1 = await prisma.lesson.create({
    data: {
      id: "1",
      title: "Từ loại (Lý thuyết - Buổi 1)",
      duration: "45:00",
      thumbnail: "/assets/1766474256-video_0360702d.png",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      playlistId: "playlist-grammar",
      documents: [
        { name: "[ Cô Vũ Mai Phương ] Từ loại (Lý thuyết - Buổi 1)_ Danh từ.pdf", url: "#" }
      ],
      quizPoints: QUIZ_POINTS,
      homeworkTasks: ["EZ Vocab"],
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      id: "2",
      title: "Thi Online: Danh từ",
      duration: "30:00",
      thumbnail: "/assets/1766474256-livestrea_3449e942.png",
      videoUrl: null,
      playlistId: "playlist-grammar",
      exerciseId: "progress-test-1",
      documents: [
        { name: "[ Cô Vũ Mai Phương ] Thi Online_Danh từ.pdf", url: "#" }
      ],
      homeworkTasks: ["Tập dịch thông minh"],
    },
  });

  const lesson3 = await prisma.lesson.create({
    data: {
      id: "3",
      title: "Từ loại (Lý thuyết - Buổi 2)",
      duration: "52:12",
      thumbnail: "/assets/1766474256-livestrea_3449e942.png",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      playlistId: "playlist-grammar",
      documents: [
        { name: "[ Cô Vũ Mai Phương ] Từ loại (Lý thuyết - Buổi 2)_ Tính từ.pdf", url: "#" }
      ],
      quizPoints: QUIZ_POINTS,
      homeworkTasks: ["EZ Vocab"],
    },
  });

  const lesson4 = await prisma.lesson.create({
    data: {
      id: "4",
      title: "Thi online: Tính từ",
      duration: "30:00",
      thumbnail: "/assets/1766474256-livestrea_3449e942.png",
      videoUrl: null,
      playlistId: "playlist-grammar",
      exerciseId: "progress-test-2",
      documents: [
        { name: "[ Cô Vũ Mai Phương ] Thi Online_Tính từ.pdf", url: "#" }
      ],
      homeworkTasks: ["Tập dịch thông minh"],
    },
  });

  const lesson5 = await prisma.lesson.create({
    data: {
      id: "5",
      title: "Từ loại (Lý thuyết - Buổi 3)",
      duration: "48:15",
      thumbnail: "/assets/1766474256-video_0360702d.png",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      playlistId: "playlist-grammar",
      documents: [
        { name: "[ Cô Vũ Mai Phương ] Từ loại (Lý thuyết - Buổi 3)_ Trạng từ.pdf", url: "#" }
      ],
      quizPoints: QUIZ_POINTS,
      homeworkTasks: ["EZ Vocab"],
    },
  });

  const lesson6 = await prisma.lesson.create({
    data: {
      id: "6",
      title: "Thi online: Trạng từ",
      duration: "30:00",
      thumbnail: "/assets/1766474256-livestrea_3449e942.png",
      videoUrl: null,
      playlistId: "playlist-grammar",
      exerciseId: "progress-test-3",
      documents: [
        { name: "[ Cô Vũ Mai Phương ] Thi Online_Trạng từ.pdf", url: "#" }
      ],
      homeworkTasks: ["Tập dịch thông minh"],
    },
  });

  const lesson7 = await prisma.lesson.create({
    data: {
      id: "7",
      title: "Từ loại (Bài tập Ứng dụng - Buổi 1)",
      duration: "50:00",
      thumbnail: "/assets/1766474256-video_0360702d.png",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      playlistId: "playlist-grammar",
      documents: [
        { name: "[ Cô Vũ Mai Phương ] Từ loại (Bài tập Ứng dụng - Buổi 1).pdf", url: "#" }
      ],
      quizPoints: QUIZ_POINTS,
      homeworkTasks: ["EZ Vocab"],
    },
  });

  console.log("Seeded Lessons!");

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
      lessonId: lesson3.id,
    },
  ];

  for (const comment of comments) {
    await prisma.comment.create({ data: comment });
  }
  console.log("Seeded Comments!");

  // 3. Seed Flashcard Decks & Cards
  await prisma.flashcardDeck.deleteMany();
  await prisma.flashcardCard.deleteMany();

  const deck1 = await prisma.flashcardDeck.create({
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
    await prisma.flashcardCard.create({
      data: {
        deckId: deck1.id,
        front: card.front,
        back: card.back,
      },
    });
  }

  const deck2 = await prisma.flashcardDeck.create({
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
    await prisma.flashcardCard.create({
      data: {
        deckId: deck2.id,
        front: card.front,
        back: card.back,
      },
    });
  }

  console.log("Seeded Flashcards!");

  // 4. Seed Exams & Questions
  await prisma.exam.deleteMany();
  await prisma.question.deleteMany();

  const exam1 = await prisma.exam.create({
    data: {
      id: "so-ha-noi-2026",
      title: "Đề thi thử Tốt nghiệp THPT 2026 - Sở GD&ĐT Hà Nội (Lần 1)",
      category: "school-exams",
      duration: 60,
      cardCount: 3,
    },
  });

  const exam2 = await prisma.exam.create({
    data: {
      id: "progress-test-1",
      title: "Thi Online: Danh từ",
      category: "progress-test",
      duration: 30,
      cardCount: 25,
    },
  });

  const exam3 = await prisma.exam.create({
    data: {
      id: "progress-test-2",
      title: "Thi online: Tính từ",
      category: "progress-test",
      duration: 30,
      cardCount: 2,
    },
  });

  const exam4 = await prisma.exam.create({
    data: {
      id: "progress-test-3",
      title: "Thi online: Trạng từ",
      category: "progress-test",
      duration: 30,
      cardCount: 2,
    },
  });

  const exam5 = await prisma.exam.create({
    data: {
      id: "reading-progress-test",
      title: "Reading Progress Test (Tổng hợp)",
      category: "progress-test",
      duration: 60,
      cardCount: 51,
    },
  });

  const questions = [
    // Questions for progress-test-2
    {
      examId: "progress-test-2",
      number: 1,
      text: "The new software is designed to be highly _____.",
      options: { A: "efficient", B: "efficiency", C: "efficiently", D: "effice" },
      correctAnswer: "A",
      explanation: "Chọn tính từ 'efficient' sau động từ liên kết 'be'.",
    },
    {
      examId: "progress-test-2",
      number: 2,
      text: "She was _____ when she heard the good news.",
      options: { A: "excited", B: "excite", C: "exciting", D: "excitingly" },
      correctAnswer: "A",
      explanation: "Chọn tính từ đuôi -ed 'excited' để miêu tả cảm xúc của con người.",
    },
    // Questions for progress-test-3
    {
      examId: "progress-test-3",
      number: 1,
      text: "The manager reviewed the contract _____ before signing it.",
      options: { A: "carefully", B: "careful", C: "carefulness", D: "caring" },
      correctAnswer: "A",
      explanation: "Chọn trạng từ 'carefully' bổ nghĩa cho động từ 'reviewed'.",
    },
    {
      examId: "progress-test-3",
      number: 2,
      text: "The system runs _____ during off-peak hours.",
      options: { A: "smoothly", B: "smooth", C: "smoothness", D: "smoothed" },
      correctAnswer: "A",
      explanation: "Chọn trạng từ 'smoothly' bổ nghĩa cho động từ 'runs'.",
    },
  ];

  // Generate 25 questions for Nouns (progress-test-1)
  for (let i = 1; i <= 25; i++) {
    questions.push({
      examId: "progress-test-1",
      number: i,
      text: `The free clinic was founded by a group of doctors to give _____ for various medical conditions (Noun Question ${i}).`,
      options: { A: "treatment", B: "treat", C: "treated", D: "treating" },
      correctAnswer: "A",
      explanation: `Chọn danh từ 'treatment' (sự điều trị) làm tân ngữ cho động từ 'give' ở câu hỏi số ${i}.`,
    });
  }

  // Load and add default questions for reading-progress-test
  const questionsJsonPath = path.join(__dirname, "questions.json");
  if (fs.existsSync(questionsJsonPath)) {
    const defaultQuestions = JSON.parse(fs.readFileSync(questionsJsonPath, "utf8"));
    for (const q of defaultQuestions) {
      questions.push({
        examId: "reading-progress-test",
        number: q.number,
        text: q.text,
        options: q.options || undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || undefined,
      });
    }
  }

  for (const q of questions) {
    await prisma.question.create({
      data: {
        examId: q.examId,
        number: q.number,
        text: q.text,
        options: q.options || undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || undefined,
      },
    });
  }

  console.log("Seeded Exams!");

  // 5. Seed Users
  await prisma.user.deleteMany();
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash("admin123", salt);
  const studentPassword = await bcrypt.hash("student123", salt);

  await prisma.user.create({
    data: {
      username: "admin",
      password: adminPassword,
      name: "Cô giáo Dung",
      role: "admin",
      allowedCourses: [],
      allowedExams: [],
    },
  });

  await prisma.user.create({
    data: {
      username: "student",
      password: studentPassword,
      name: "Nguyễn Văn Học Sinh",
      role: "student",
      allowedCourses: ["toan-9-he-2k12", "tieng-anh-9-he-2k12"],
      allowedExams: ["so-ha-noi-2026"],
    },
  });

  console.log("Seeded Users!");
  console.log("Seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
