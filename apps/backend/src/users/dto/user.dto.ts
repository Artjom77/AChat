import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdateAiPreferencesDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  assistantEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assistantPersonality?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoResponderEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  autoResponderRules?: any;
}
