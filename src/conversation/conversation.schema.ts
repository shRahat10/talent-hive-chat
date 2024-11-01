import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/user/user.schema';

@Schema({ timestamps: true })
export class Conversation extends Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    user1: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    user2: User;

    @Prop([
        {
            sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            message: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            isRead: {type: Boolean, default: false},
        }
    ])
    messages: Array<{
        sender: Types.ObjectId;
        message: string;
        createdAt: Date;
        isRead: Boolean;
    }>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
