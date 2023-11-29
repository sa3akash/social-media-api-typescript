import mongoose, { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { NameDoc } from '@auth/interfaces/auth.interface';

export interface IUserDocument extends Document {
  _id: string | ObjectId;
  authId: string | ObjectId;
  postsCount: number;
  work: string;
  school: string;
  website: string;
  gender: string;
  blocked: mongoose.Types.ObjectId[];
  blockedBy: mongoose.Types.ObjectId[];
  followersCount: number;
  followingCount: number;
  notifications: INotificationSettings;
  social: ISocialLinks;
  createdAt?: Date;
  address: AddressDoc;
  relationShip: RelationShipDoc;
  dob: DobDoc;
}

export interface RelationShipDoc {
  type: 'Single' | 'In a relationship' | 'Married' | 'Divorced';
  partner: string;
}

interface DobDoc {
  day: string;
  month: string;
  year: string;
}

interface AddressDoc {
  street: string;
  city: string;
  zipcode: string;
  local: string;
  country: string;
}

export interface IResetPasswordParams {
  username: string;
  email: string;
  ipaddress: string;
  date: string;
}

export interface INotificationSettings {
  messages: boolean;
  reactions: boolean;
  comments: boolean;
  follows: boolean;
}

export interface IBasicInfo {
  quote: string;
  work: string;
  school: string;
  location: string;
}

export interface ISocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
}

export interface ISearchUser {
  _id: string | ObjectId;
  uId: string;
  coverPicture: string;
  profilePicture: string;
  name: NameDoc;
  username: string;
  email: string;
  quote: string;
  avatarColor: string;
}

export interface ISocketData {
  blockedUser: string;
  blockedBy: string;
}

export interface ILogin {
  authId: string;
}

export interface IUserJobInfo {
  key?: string;
  value?: string | ISocialLinks;
}

export interface IUserJob {
  keyOne?: string;
  keyTwo?: string;
  key?: string;
  value?: string | INotificationSettings | IUserDocument;
}

export interface IEmailJob {
  receiverEmail: string;
  template: string;
  subject: string;
}

export interface IAllUsers {
  users: IUserDocument[];
  totalUsers: number;
}
