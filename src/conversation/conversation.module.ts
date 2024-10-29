import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './conversation.schema';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { User, UserSchema } from 'src/user/user.schema';
import { ConversationGateway } from './conversation.gateway';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [ConversationController],
    providers: [ConversationService, ConversationGateway],
})
export class ConversationModule { }
