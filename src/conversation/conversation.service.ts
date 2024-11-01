import { Injectable, NotFoundException } from '@nestjs/common';
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
            ]
        }).populate('user1 user2', 'fullName profileImage');

        if (!conversation) {
            conversation = new this.conversationModel({ user1, user2, messages: [] });
            await conversation.save();
        }
        return conversation;
    }

    async getChatList(userId: string): Promise<any[]> {
        const conversations = await this.conversationModel.find({
            $or: [{ user1: userId }, { user2: userId }],
            'messages.0': { $exists: true },
        })
            .sort({ updatedAt: -1 })
            .populate('user1 user2', 'fullName profileImage')
            .exec();

        return conversations.map(conversation => {
            const otherUser = conversation.user1._id.toString() === userId
                ? conversation.user2
                : conversation.user1;

            return {
                id: conversation._id,
                otherUserId: otherUser._id,
                otherUserFullName: otherUser.fullName,
                otherUserProfileImage: otherUser.profileImage,
                lastMessage: conversation.messages.at(-1).message,
                lastMessageDate: conversation.messages.at(-1).createdAt,
                lastMessageIsRead: conversation.messages.at(-1).isRead,
            };
        });
    }

    async createMessage(dto: CreateConversationDto): Promise<Conversation> {
        const { sender, receiver, message } = dto;
        const conversation = await this.findOrCreateConversation(sender, receiver);

        conversation.messages.push({
            sender: new Types.ObjectId(sender),
            message,
            createdAt: new Date(),
            isRead: false,
        });

        await conversation.save();

        return this.conversationModel.findById(conversation._id)
            .populate('user1 user2', 'fullName profileImage')
            .populate('messages.sender', 'fullName profileImage')
            .exec();
    }

    async getConversation(user1: string, user2: string): Promise<Conversation> {
        return this.conversationModel.findOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ]
        })
            .populate('user1 user2', 'fullName profileImage')
            .populate('messages.sender', 'fullName profileImage')
            .exec();
    }

    async markAsRead(conversationId: string): Promise<Conversation> {
        const conversation = await this.conversationModel.findById(conversationId);

        if (!conversation) {
            throw new NotFoundException(`Conversation with id ${conversationId} not found`);
        }

        conversation.messages.forEach(message => {
            if (!message.isRead) {
                message.isRead = true;
            }
        });

        return await conversation.save();
    }
}
