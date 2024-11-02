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

            const lastMessage = conversation.messages.at(-1);

            const unreadCount = conversation.messages.filter(
                (message) => message.sender.toString() === otherUser._id.toString() && !message.isRead
            ).length;

            return {
                id: conversation._id,
                otherUserId: otherUser._id,
                otherUserFullName: otherUser.fullName,
                otherUserProfileImage: otherUser.profileImage,
                lastMessage: lastMessage.message,
                lastMessageDate: lastMessage.createdAt,
                lastMessageIsRead: lastMessage.isRead,
                senderId: lastMessage.sender,
                unreadCount,
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

    async markAsRead(userId: string, contactId: string, markAll: boolean): Promise<Conversation> {
        const conversation = await this.conversationModel.findOne({
            $or: [
                { user1: userId, user2: contactId },
                { user1: contactId, user2: userId },
            ],
        });

        if (!conversation) {
            throw new NotFoundException(`Conversation between users ${userId} and ${contactId} not found`);
        }

        conversation.messages.forEach((message) => {
            if (!message.isRead && message.sender.toString() === contactId) {
                message.isRead = true;
            }
        });

        return await conversation.save();
    }
}
