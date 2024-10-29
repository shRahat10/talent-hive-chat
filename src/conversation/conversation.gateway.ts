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
        // console.log('Client connected:', client.id);
    }

    handleDisconnect(client: any) {
        // console.log('Client disconnected:', client.id);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(client: any, messageData: CreateConversationDto) {
        const updatedConversation = await this.conversationService.createMessage(messageData);
        this.server.emit('message', updatedConversation);

        return updatedConversation;
    }
}
