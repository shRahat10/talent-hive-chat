import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation } from './conversation.schema';
import { CreateConversationDto } from './dto/conversation.dto';

@Injectable()
export class ConversationService {
    constructor(
        @InjectModel(Conversation.name) private readonly conversationModel: Model<Conversation>,
    ) { }

    async findOrCreateConversation(user1: string, user2: string): Promise<Conversation> {
        let conversation = await this.conversationModel.findOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ],
        });
        if (!conversation) {
            conversation = new this.conversationModel({ user1, user2, messages: [] });
            await conversation.save();
        }
        return conversation;
    }

    async getChatList(userId: string): Promise<any[]> {
        const conversations = await this.conversationModel.find({
            $or: [{ user1: userId }, { user2: userId }]
        })
            .sort({ updatedAt: -1 })
            .populate('user1', 'fullName profileImage')
            .populate('user2', 'fullName profileImage')
            .exec();

        const chatList = conversations.map(conversation => {
            const otherUser = conversation.user1?._id.toString() === userId ? conversation.user2 : conversation.user1;

            if (!otherUser) {
                console.error(`User not found for conversation: ${conversation._id}`);
                return null;
            }

            return {
                id: conversation._id,
                otherUserId: otherUser._id,
                otherUserFullName: otherUser.fullName,
                otherUserProfileImage: otherUser.profileImage,
                lastMessage: conversation.messages[conversation.messages.length - 1]?.message || 'No messages yet',
                lastMessageDate: conversation.messages[conversation.messages.length - 1]?.createdAt || null,
            };
        }).filter(Boolean);

        return chatList;
    }

    async getConversation(user1: string, user2: string): Promise<Conversation> {
        const conversation = await this.conversationModel
            .findOne({
                $or: [
                    { user1, user2 },
                    { user1: user2, user2: user1 },
                ],
            })
            .populate('user1', 'fullName profileImage')
            .populate('user2', 'fullName profileImage')
            .populate('messages.sender', 'fullName profileImage')
            .exec();

        if (!conversation) {
            return this.findOrCreateConversation(user1, user2);
        }

        return conversation;
    }

    async createMessage(createConversationDto: CreateConversationDto): Promise<Conversation> {
        const { sender, receiver, message } = createConversationDto;

        const conversation = await this.findOrCreateConversation(sender, receiver);

        conversation.messages.push({
            sender: new Types.ObjectId(sender),
            message,
            createdAt: new Date(),
        });

        await conversation.save();

        return this.conversationModel
            .findById(conversation._id)
            .populate('user1', 'fullName profileImage')
            .populate('user2', 'fullName profileImage')
            .populate('messages.sender', 'fullName profileImage')
            .exec();
    }
}
