import { NameDoc } from '@auth/interfaces/auth.interface';
import { IReactions } from '@reaction/interfaces/reaction.interface';
import { Document, ObjectId } from 'mongoose';

export interface ICommentDocument extends Document {
  content: string;
  author: ObjectId;
  postId: ObjectId;
  parentId: ObjectId | null;
  replyToUser: ObjectId | null;
  path: ObjectId[];
  depth: number;
  reactions?: IReactions;
  createdAt: Date;
  updatedAt: Date;
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
