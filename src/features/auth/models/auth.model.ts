import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { hash, compare } from 'bcryptjs';

import { model, Model, Schema } from 'mongoose';

const SALT_ROUND = 15;

const authSchema: Schema = new Schema(
  {
    username: { type: String, lowercase: true, unique: true },
    uId: { type: String },
    email: { type: String, lowercase: true, unique: true },
    password: { type: String },
    name: {
      first: { type: String },
      last: { type: String },
      nick: { type: String }
    },
    avatarColor: { type: String },
    profilePicture: { type: String },
    quote: { type: String, default: '' },
    coverPicture: { type: String },
    createdAt: { type: Date, default: Date.now },
    passwordResetToken: { type: String, default: '' },
    passwordResetExpires: { type: Number }
  },
  {
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

authSchema.pre('save', async function (this: IAuthDocument, next: () => void) {
  const hashedPassword: string = await hash(this.password as string, SALT_ROUND);
  this.password = hashedPassword;
  next();
});

authSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  const hashedPassword: string = (this as unknown as IAuthDocument).password!;
  return compare(password, hashedPassword);
};

authSchema.methods.hashPassword = async function (password: string): Promise<string> {
  return hash(password, SALT_ROUND);
};

const AuthModel: Model<IAuthDocument> = model<IAuthDocument>('Auth', authSchema, 'Auth');

export { AuthModel };
