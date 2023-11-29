import { AuthPayload, FullUserDoc, NameDoc } from '@auth/interfaces/auth.interface';
import { IReaction } from '@reaction/interfaces/reaction.interface';
import mongoose, { Document } from 'mongoose';

// export interface IMessageDocument extends Document {
//   _id: mongoose.Types.ObjectId;
//   conversationId: mongoose.Types.ObjectId;
//   senderId: mongoose.Types.ObjectId;
//   receiverId: mongoose.Types.ObjectId;
//   senderObject?: AuthUserDoc;
//   receiverObject?: AuthUserDoc;
//   body: string;
//   gifUrl: string;
//   isRead: boolean;
//   files?: IFiles[] | [];
//   reaction: IReaction[];
//   createdAt: Date;
//   deleteForMe: boolean;
//   deleteForEveryone: boolean;
// }

export interface IMessageData extends Document {
  _id: string;
  conversationId: string;
  senderObject?: AuthUserDoc;
  receiverObject?: AuthUserDoc;
  receiverId: string;
  senderId: string;
  body: string;
  isRead: boolean;
  gifUrl: string;
  files?: IFiles[] | [];
  reaction: IReaction[];
  createdAt: Date | string;
  deleteForMe: boolean;
  deleteForEveryone: boolean;
}

export interface IFiles {
  fieldname: string;
  originalname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  path: string;
  size: number;
}

interface AuthUserDoc {
  authId: string;
  profilePicture: string;
  coverPicture: string;
  email: string;
  username: string;
  avatarColor: string;
  uId: string;
  name: NameDoc;
}

export interface IMessageNotification {
  currentUser: AuthPayload;
  message: string;
  receiverName: string;
  receiverId?: string;
  receiverObject?: FullUserDoc;
  messageData: IMessageData;
}

export interface IChatUsers {
  userOne: string;
  userTwo: string;
}

export interface IChatList {
  receiverId: string;
  conversationId: string;
}

export interface ITyping {
  sender: string;
  receiver: string;
}

export interface IChatJobData {
  senderId?: mongoose.Types.ObjectId | string;
  receiverId?: mongoose.Types.ObjectId | string;
  messageId?: mongoose.Types.ObjectId | string;
  senderName?: string;
  reaction?: string;
  type?: string;
}

export interface ISenderReceiver {
  senderId: string;
  receiverId: string;
  // senderName: string;
  // receiverName: string;
}

export interface IGetMessageFromCache {
  index: number;
  message: IMessageData;
  // receiver: IChatList;
}

export interface IMarkDeleteMessage {
  messageId: string;
  type: 'deleteForMe' | 'deleteForEveryone';
}
export interface IMarkReadMessage {
  conversationId: string;
  authId: string;
}

export interface IReactionMessage {
  messageId: string;
  senderName: string;
  type: string;
}
