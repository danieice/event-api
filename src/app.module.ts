import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './config/database.config';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { EventsModule } from './modules/events/events.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { UsersModule } from './modules/users/users.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
    TypeOrmModule.forRootAsync({ useFactory: buildDataSourceOptions }),
    UsersModule,
    AuthModule,
    EventsModule,
    RegistrationsModule,
    HealthModule,
  ],
  // every route requires a JWT unless marked @Public()
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
