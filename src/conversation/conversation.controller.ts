import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/conversation.dto';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) { }

  @Get(':userId')
  async getChatList(
    @Param('userId') userId: string,
  ) {
    return this.conversationService.getChatList(userId);
  }

  @Get(':user1/:user2')
  async getConversation(
    @Param('user1') user1: string,
    @Param('user2') user2: string,
  ) {
    const conversation = await this.conversationService.getConversation(user1, user2);
    if (!conversation) {
      return { message: 'Conversation not found' };
    }
    return conversation;
  }

  @Post('get-or-create')
  async getOrCreateConversation(@Body() body) {
    const { userId, contactId } = body;
    return this.conversationService.findOrCreateConversation(userId, contactId);
  }

  @Post()
  async createMessage(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationService.createMessage(createConversationDto);
  }
}
