import { Module } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { EnclaveModule } from '../enclave/enclave.module';

@Module({
  imports: [EnclaveModule],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
