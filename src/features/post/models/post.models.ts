import { IPostDocument } from '@post/interfaces/post.interfaces';
import mongoose, { model, Model, Schema } from 'mongoose';

const postSchema: Schema = new Schema({
  authId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', index: true },
  post: { type: String, default: '' },
  bgColor: { type: String, default: '' },
  feelings: { type: String, default: '' },
  gifUrl: { type: String, default: '' },
  privacy: { type: String, enum: ['Public', 'Private', 'Only me'], default: 'Public' },
  commentsCount: { type: Number, default: 0 },
  files: [
    {
      fieldname: { type: String },
      originalname: { type: String },
      filename: { type: String },
      encoding: { type: String },
      mimetype: { type: String },
      path: { type: String },
      size: { type: Number }
    }
  ],
  reactions: {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    happy: { type: Number, default: 0 },
    wow: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    angry: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

const PostModel: Model<IPostDocument> = model<IPostDocument>('Post', postSchema, 'Post');

export { PostModel };
