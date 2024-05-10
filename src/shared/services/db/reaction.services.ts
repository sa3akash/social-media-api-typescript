import { IReactionDocument, IReactionsGet } from '@reaction/interfaces/reaction.interface';
import { ReactionModel } from '@reaction/models/reaction.model';
import mongoose from 'mongoose';

class ReactionService {
  public async addReaction(reactionData: IReactionDocument): Promise<void> {
    await ReactionModel.create(reactionData);
  }

  public async getReactionByPostIdAndAuthId(postId: string, authId: string): Promise<IReactionDocument> {
    return (await ReactionModel.findOne({
      postId: postId,
      authId: authId
    })) as unknown as IReactionDocument;
  }

  public async deleteReactionById(reactionId: string): Promise<void> {
    await ReactionModel.findByIdAndDelete(reactionId);
  }

  public async allDeleteReactionById(postId: string): Promise<void> {
    await ReactionModel.deleteMany({ postId: postId });
  }

  public async updateReactionById(reactionId: string, type: string): Promise<void> {
    await ReactionModel.findByIdAndUpdate(reactionId, {
      type: type
    });
  }

  public async getReactionsByPostId(postId: string, start: number, end: number): Promise<IReactionsGet> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId) } },
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: end },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregateReactionProject() }
    ]);

    const ReactionCount: number = await ReactionModel.find({ postId: postId }).countDocuments();

    return {
      reactions: reactions.length ? reactions : [],
      reactionsCount: ReactionCount || 0
    } as IReactionsGet;
  }

  public async getReactionsByPostIdWithType(postId: string, type: string, start: number, end: number): Promise<IReactionsGet> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId), type: type } },
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: end },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregateReactionProject() }
    ]);

    const ReactionCount: number = await ReactionModel.find({ postId: postId, type: type }).countDocuments();

    return {
      reactions: reactions.length ? reactions : [],
      reactionsCount: ReactionCount || 0
    } as IReactionsGet;
  }

  public async getSingleReactionsByAuthId(postId: string, authId: string): Promise<IReactionsGet> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId), authId: new mongoose.Types.ObjectId(authId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregateReactionProject() }
    ]);

    return {
      reactions: reactions[0] || {},
      reactionsCount: 1
    } as unknown as IReactionsGet;
  }

  public async getAllReactionSpacificUser(authId: string): Promise<IReactionDocument[]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(authId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregateReactionProject() }
    ]);

    return reactions;
  }

  private aggregateReactionProject() {
    return {
      _id: 1,
      postId: 1,
      authId: 1,
      type: 1,
      createdAt: 1,
      creator: {
        authId: '$authData._id',
        avatarColor: '$authData.avatarColor',
        coverPicture: '$authData.coverPicture',
        email: '$authData.email',
        name: '$authData.name',
        profilePicture: '$authData.profilePicture',
        uId: '$authData.uId',
        username: '$authData.username',
        createdAt: '$authData.createdAt'
      }
    };
  }
}

export const reactionService: ReactionService = new ReactionService();
