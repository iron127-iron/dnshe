import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

const cachedApp: express.Express = express();

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(cachedApp),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.init();
  return cachedApp;
}

let handler: any;

export default async function (req: any, res: any) {
  if (!handler) {
    const app = await bootstrap();
    handler = serverless(app);
  }
  return handler(req, res);
}
