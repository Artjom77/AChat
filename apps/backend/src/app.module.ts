import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { CallsModule } from './calls/calls.module';
import { PaymentsModule } from './payments/payments.module';
import { GiftsModule } from './gifts/gifts.module';
import { ModerationModule } from './moderation/moderation.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { EnclaveModule } from './enclave/enclave.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'achat',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'achat',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // Disable in production!
      logging: process.env.NODE_ENV === 'development',
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    MessagesModule,
    CallsModule,
    PaymentsModule,
    GiftsModule,
    ModerationModule,
    AiAssistantModule,
    EnclaveModule,
  ],
})
export class AppModule {}
