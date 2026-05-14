import { NestFactory, Reflector } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');

// Shared express instance — re-used across warm Vercel invocations
const expressApp = express();
let nestApp: any;

async function createApp() {
  if (nestApp) return nestApp; // reuse warm instance

  const adapter = new ExpressAdapter(expressApp);
  nestApp = await NestFactory.create(AppModule, adapter, { logger: ['error', 'warn', 'log'] });

  // Global Interceptors
  const reflector = nestApp.get(Reflector);
  nestApp.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(reflector),
  );

  // Global Filter for Error Responses
  nestApp.useGlobalFilters(new HttpExceptionFilter());

  // Enable Validation
  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  nestApp.enableShutdownHooks();

  // Enable CORS
  nestApp.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set global prefix for all routes
  nestApp.setGlobalPrefix('api');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Livestock Asset Management API')
    .setDescription('API for livestock ownership platform')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(nestApp, config);
  SwaggerModule.setup('docs', nestApp, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await nestApp.init();
  return nestApp;
}

// ── Vercel: export a serverless handler ───────────────────────────────────
// When deployed on Vercel, vercel.json routes all traffic to this export.
export default async (req: any, res: any) => {
  await createApp();
  expressApp(req, res);
};

// ── Local dev: start a regular HTTP server ────────────────────────────────
// `nest start` / `npm run start` lands here.
if (!process.env.VERCEL) {
  (async () => {
    await createApp();
    const port = process.env.PORT || 3001;
    await nestApp.listen(port);
    console.log(`Application is running on: http://localhost:${port}/api`);
    console.log(`Swagger documentation:       http://localhost:${port}/docs`);
  })();
}
