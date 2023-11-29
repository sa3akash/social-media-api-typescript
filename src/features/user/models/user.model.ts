import { IUserDocument } from '@user/interfaces/user.interface';
import mongoose, { model, Model, Schema } from 'mongoose';

const userSchema: Schema = new Schema({
  authId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', index: true },
  postsCount: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notifications: {
    messages: { type: Boolean, default: true },
    reactions: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true }
  },
  social: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  work: { type: String, default: '' },
  school: { type: String, default: '' },
  website: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'custom'] },
  relationShip: {
    type: { type: String, enum: ['Single', 'In a relationship', 'Married', 'Divorced'], default: 'Single' },
    partner: { type: String }
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    zipcode: { type: String, default: '' },
    local: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  dob: {
    day: { type: String, default: '' },
    month: { type: String, default: '' },
    year: { type: String, default: '' }
  },
  createdAt: { type: Date, default: new Date() }
});

const UserModel: Model<IUserDocument> = model<IUserDocument>('User', userSchema, 'User');
export { UserModel };
