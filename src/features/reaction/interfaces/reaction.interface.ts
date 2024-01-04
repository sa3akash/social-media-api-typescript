import { ICreator } from '@post/interfaces/post.interfaces';
import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export interface IReactionDocument extends Document {
  _id?: string | ObjectId;
  authId?: string;
  creator?: ICreator;
  type: string;
  postId: string;
  createdAt?: Date;
}

export interface IReactions {
  like: number;
  love: number;
  care: number;
  happy: number;
  wow: number;
  sad: number;
  angry: number;
}

export interface IReactionJob {
  previousReaction: IReactionDocument;
  type: string;
}
export interface IReactionsGet {
  reactions: IReactionDocument[];
  reactionsCount: number;
}
export interface IReactionsSingle {
  reaction: IReactionDocument;
  reactionCount: number;
}

export interface IQueryReaction {
  _id?: string | ObjectId;
  postId?: string | ObjectId;
}

export interface IReaction {
  senderName: string;
  type: string;
}
