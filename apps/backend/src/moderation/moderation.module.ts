import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { EnclaveModule } from '../enclave/enclave.module';

@Module({
  imports: [EnclaveModule],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
