import { AuthPayload } from '@auth/interfaces/auth.interface';
import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export interface ICommentDocument extends Document {
  _id?: string | ObjectId;
  postId: string;
  commentedUser: string | ObjectId | AuthPayload;
  comment: string;
  createdAt?: Date;
  userTo?: string | ObjectId;
}

export interface ICommentJob {
  postId: string;
  userTo: string;
  userFrom: string;
  username: string;
  comment: ICommentDocument;
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
