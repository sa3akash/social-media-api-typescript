import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { IUserDocument } from '@user/interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthPayload;
    }
  }
}

export interface AuthPayload {
  id: string;
  email: string;
  username: string;
  avatarColor: string;
  iat?: number;
}

export interface IAuthDocument extends Document {
  _id: string | ObjectId;
  uId: string;
  coverPicture: ImageStoreDoc;
  profilePicture: ImageStoreDoc;
  name: NameDoc;
  username: string;
  email: string;
  quote: string;
  password?: string;
  avatarColor: string;
  createdAt: Date;
  passwordResetToken?: string;
  passwordResetExpires?: number | string;
  comparePassword(password: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

export interface ISignUpData {
  _id: ObjectId;
  email: string;
  name: NameDoc;
  password: string;
}

interface NameDoc {
  first: string;
  last: string;
  nick: string;
}

interface ImageStoreDoc {
  url: string;
  hash: string;
}

export interface IAuthJob {
  value?: string | IAuthDocument | IUserDocument;
}

export type FullUserDoc = IUserDocument & IAuthDocument;
