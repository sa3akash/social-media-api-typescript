import { IConversationDocument } from '@chat/interfaces/convarsation.interfaces';
import mongoose, { Model, model, Schema } from 'mongoose';

const conversationSchema: Schema = new Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' }
});

const ConversationModel: Model<IConversationDocument> = model<IConversationDocument>('Conversation', conversationSchema, 'Conversation');
export { ConversationModel };
