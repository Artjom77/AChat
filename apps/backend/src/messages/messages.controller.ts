import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto, CreateGroupDto } from './dto/message.dto';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(@Req() req: any, @Body() sendMessageDto: SendMessageDto) {
    return await this.messagesService.sendMessage(
      req.user.id,
      sendMessageDto,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  async getConversations(@Req() req: any) {
    return await this.messagesService.getUserConversations(req.user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  async getMessages(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return await this.messagesService.getMessages(
      req.user.id,
      conversationId,
      limit,
      before,
    );
  }

  @Post('conversations/direct')
  @ApiOperation({ summary: 'Get or create direct conversation' })
  async getOrCreateDirectConversation(
    @Req() req: any,
    @Body() body: { userId: string },
  ) {
    return await this.messagesService.getOrCreateDirectConversation(
      req.user.id,
      body.userId,
    );
  }

  @Post('conversations/group')
  @ApiOperation({ summary: 'Create group conversation' })
  async createGroupConversation(
    @Req() req: any,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return await this.messagesService.createGroupConversation(
      req.user.id,
      createGroupDto.name,
      createGroupDto.participantIds,
    );
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  async markAsRead(@Req() req: any, @Param('id') messageId: string) {
    await this.messagesService.markAsRead(messageId, req.user.id);
    return { success: true };
  }
}
