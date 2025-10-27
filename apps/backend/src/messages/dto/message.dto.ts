import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
} from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  conversationId: string;

  @ApiProperty()
  @IsString()
  encryptedContent: string;

  @ApiProperty()
  @IsString()
  encryptedKey: string;

  @ApiProperty()
  @IsString()
  iv: string;

  @ApiProperty()
  @IsString()
  authTag: string;

  @ApiProperty({ enum: MessageType, default: MessageType.TEXT })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  replyToId?: string;
}

export class CreateGroupDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];
}
