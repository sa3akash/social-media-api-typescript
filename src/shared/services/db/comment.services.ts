import { ICommentDocument } from '@comment/interfaces/comment.interface';
import { CommentsModel } from '@comment/models/comment.model';
import mongoose from 'mongoose';

class CommentService {
  public async addCommentDB(data: ICommentDocument): Promise<void> {
    await CommentsModel.create(data);
  }

  public async getCommentsDB(postId: string, skip: number, limit: number): Promise<ICommentDocument[]> {
    const commentsDB: ICommentDocument[] = await CommentsModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId) } },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'Auth', localField: 'commentedUser', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregateReactionProject() }
    ]);

    return commentsDB;
  }

  public async getCommentsCountDB(postId: string): Promise<number> {
    return await CommentsModel.find({ postId }).countDocuments();
  }

  private aggregateReactionProject() {
    return {
      _id: 1,
      postId: 1,
      comment: 1,
      createdAt: 1,
      commentedUser: {
        id: '$authData._id',
        avatarColor: '$authData.avatarColor',
        coverPicture: '$authData.coverPicture',
        email: '$authData.email',
        name: '$authData.name',
        profilePicture: '$authData.profilePicture',
        uId: '$authData.uId',
        username: '$authData.username'
      }
    };
  }
}

export const commentService: CommentService = new CommentService();
