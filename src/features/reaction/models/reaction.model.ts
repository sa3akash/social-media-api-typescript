import { IReactionDocument } from '@reaction/interfaces/reaction.interface';
import mongoose, { model, Model, Schema } from 'mongoose';

const reactionSchema: Schema = new Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true },
  authId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', index: true },
  type: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now() }
});

const ReactionModel: Model<IReactionDocument> = model<IReactionDocument>('Reaction', reactionSchema, 'Reaction');

export { ReactionModel };
