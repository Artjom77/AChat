import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('AChat API')
    .setDescription('The most secure AI-powered messenger API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('messages', 'Messaging')
    .addTag('calls', 'Voice and video calls')
    .addTag('payments', 'Subscriptions and payments')
    .addTag('gifts', 'Virtual gifts')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  🚀 AChat Backend API is running!

  📝 API Documentation: http://localhost:${port}/api/docs
  🔌 WebSocket: http://localhost:${port}
  🔐 Security: Enclave-protected AI processing

  Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();
