import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/conversation.dto';

@WebSocketGateway({ cors: true })
export class ConversationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly conversationService: ConversationService) { }

    handleConnection(client: any) {
        // Connection logic here
    }

    handleDisconnect(client: any) {
        // Disconnection logic here
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(client: any, messageData: CreateConversationDto) {
        const updatedConversation = await this.conversationService.createMessage(messageData);
        this.server.emit('message', updatedConversation);
        return updatedConversation;
    }

    @SubscribeMessage('openConversation')
    async handleOpenConversation(client: any, { userId, contactId }) {
        const conversation = await this.conversationService.getConversation(userId, contactId);
        if (conversation) {
            this.server.emit('conversationOpened', {
                senderId: userId,
                receiverId: contactId,
                messages: conversation.messages,
                conversationId: conversation._id,
            });
        }
    }
}
