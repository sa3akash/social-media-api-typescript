import { IMessageData } from '@chat/interfaces/chat.interfaces';
import mongoose, { Model, model, Schema } from 'mongoose';

const messageSchema: Schema = new Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' },
  body: { type: String, default: '' },
  gifUrl: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  deleteForMe: { type: Boolean, default: false },
  deleteForEveryone: { type: Boolean, default: false },
  files: [
    {
      fieldname: { type: String },
      originalname: { type: String },
      filename: { type: String },
      encoding: { type: String },
      mimetype: { type: String },
      path: { type: String },
      size: { type: Number }
    }
  ],
  reaction: Array,
  createdAt: { type: Date, default: Date.now }
});

const MessageModel: Model<IMessageData> = model<IMessageData>('Message', messageSchema, 'Message');
export { MessageModel };
