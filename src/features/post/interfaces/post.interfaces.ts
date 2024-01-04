import { NameDoc } from '@auth/interfaces/auth.interface';
import { IReactions } from '@reaction/interfaces/reaction.interface';
import { Document, ObjectId } from 'mongoose';

export interface IPostDocument extends Document {
  _id?: string | ObjectId;
  authId?: string | ObjectId;
  uId?: string;
  creator?: ICreator;
  post: string;
  bgColor?: string;
  commentsCount: number;
  files: IFiles[];
  feelings?: string;
  gifUrl?: string;
  privacy: 'Public' | 'Private' | 'Only me';
  reactions?: IReactions;
  createdAt?: Date | string;
}
interface IFiles {
  fieldname: string;
  originalname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  path: string;
  size: number;
}
export interface ICreator {
  authId: string | ObjectId; // authId
  uId: string;
  coverPicture: string;
  profilePicture: string;
  name: NameDoc;
  username: string;
  email: string;
  avatarColor: string;
}

export interface IGetPostsQuery {
  _id?: ObjectId | string;
  username?: string;
  file?: 'image' | 'video';
  gifUrl?: string;
  videoId?: string;
}

export interface ISavePostToCache {
  key: ObjectId | string;
  currentUserId: string;
  uId: string;
  createdPost: IPostDocument;
}

export interface IPostJobData {
  key?: string;
  value?: IPostDocument;
  keyOne?: string;
  keyTwo?: string;
  postId?: string;
  authId?: string | ObjectId;
  publicId?: string;
}

export interface IQueryComplete {
  ok?: number;
  n?: number;
}

export interface IQueryDeleted {
  deletedCount?: number;
}
