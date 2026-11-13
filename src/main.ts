import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Render sits behind a proxy; without this every request looks like it comes from the proxy's IP
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that aren't in the DTO
      forbidNonWhitelisted: true, // and reject the request if any were sent
      transform: true,
    }),
  );
    app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Event Management API')
    .setDescription('Create events, manage them, and register attendees.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: { persistAuthorization: true },
  });

  

  await app.listen(app.get(ConfigService).getOrThrow('PORT'));
}

bootstrap();