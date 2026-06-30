import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend connectivity
  app.enableCors();
  
  // Serve static files from public/uploads folder for local fallback
  const uploadDir = join(process.cwd(), '..', 'public', 'uploads');
  app.use('/uploads', express.static(uploadDir));

  await app.listen(3001);
}
bootstrap();
