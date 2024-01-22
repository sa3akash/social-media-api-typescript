import { FullUserDoc, IAuthDocument, NameDoc } from '@auth/interfaces/auth.interface';
import mongoose, { Document } from 'mongoose';

export interface INotificationDocument extends Document {
  _id?: mongoose.Types.ObjectId | string;
  creator: string | IAuthDocument | FullUserDoc;
  docCreator: string | IAuthDocument | FullUserDoc;
  message: string;
  communityName: string;
  notificationType: 'like' | 'love' | 'happy' | 'wow' | 'sad' | 'angry' | 'comment' | 'community';
  entityId: string;
  createdItemId: string;
  read?: boolean;
  createdAt?: Date;
  insertNotification(data: INotification): Promise<void>;
}

export interface INotification {
  creator: CreatorNotification;
  docCreator: string | IAuthDocument | FullUserDoc;
  message: string;
  communityName?: string;
  notificationType: 'like' | 'love' | 'happy' | 'wow' | 'sad' | 'angry' | 'comment' | 'community' | 'follow';
  entityId: string;
  createdItemId: string;
  createdAt: Date | string;
  _id?: string;
}

interface CreatorNotification {
  authId: string;
  profilePicture: string;
  coverPicture: string;
  email: string;
  username: string;
  avatarColor: string;
  uId: string;
  name: NameDoc;
}

export interface INotificationJobData {
  key?: string;
}

export interface INotificationTemplate {
  username: string;
  message: string;
  header: string;
}
