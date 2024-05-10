import { NameDoc } from '@auth/interfaces/auth.interface';
import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export interface ICommentDocument extends Document {
  _id?: string | ObjectId;
  postId: string;
  commentedUser: string | CreatorNotification;
  comment: string;
  createdAt?: Date;
  creator?: CreatorNotification;
  // userTo?: string | ObjectId;
}

export interface ICommentJob {
  value: ICommentDocument;
  creator: CreatorNotification;
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
  createdAt: string;
}

export interface ICommentNameList {
  count: number;
  names: string[];
}

export interface IQueryComment {
  _id?: string | ObjectId;
  postId?: string | ObjectId;
}

export interface IQuerySort {
  createdAt?: number;
}
