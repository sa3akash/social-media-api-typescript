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
  name: NameDoc;
  username: string;
  avatarColor: string;
  uId: string;
  coverPicture: string;
  profilePicture: string;
  iat?: number;
  createdAt: string;
}

export interface IAuthDocument extends Document {
  _id: string | ObjectId;
  uId: string;
  coverPicture: string;
  profilePicture: string;
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

export interface NameDoc {
  first: string;
  last: string;
  nick: string;
}

export interface IAuthJob {
  value?: string | IAuthDocument | IUserDocument;
}
export interface IProfileImageChange {
  authId: string;
  imageUrl?: string;
  username?: string;
}
export interface IUpdateUser {
  key: string;
  value: IUpdateUserInfoDoc | { notifications: INotificationType };
}

interface INotificationType {
  messages: boolean;
  reactions: boolean;
  comments: boolean;
  follows: boolean;
}

export interface IUpdateUserInfoDoc {
  work: string;
  school: string;
  website: string;
  gender: string;
  quote: string;
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  relationShip: {
    type: string;
    partner: string;
  };
  address: {
    street: string;
    city: string;
    zipcode: string;
    local: string;
    country: string;
  };

  dob: {
    day: string;
    month: string;
    year: string;
  };
}

export type FullUserDoc = IUserDocument & IAuthDocument;
