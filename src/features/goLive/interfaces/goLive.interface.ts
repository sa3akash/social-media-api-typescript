import mongoose from 'mongoose';

export interface IGoLive extends Document {
  _id: mongoose.Types.ObjectId | string;
  authId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  isLive: boolean;
  streamKey: string;
  privacy: string;
  createdAt?: Date;
}
