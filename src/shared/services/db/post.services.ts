import { IGetPostsQuery, IPostDocument } from '@post/interfaces/post.interfaces';
import { PostModel } from '@post/models/post.models';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.model';
import mongoose, { UpdateQuery } from 'mongoose';

class PostServices {
  async addPostInDB(postData: IPostDocument): Promise<void> {
    const post: Promise<IPostDocument> = PostModel.create(postData);
    const updateUser: UpdateQuery<IUserDocument> = UserModel.updateOne({ authId: postData.authId }, { $inc: { postsCount: 1 } });

    await Promise.all([post, updateUser]);
  }

  /*
   *
   * get all posts
   *
   */

  public async getPostsFromDB(query: IGetPostsQuery, skip = 0, limit = 0, sort: Record<string, 1 | -1>): Promise<IPostDocument[]> {
    const postQuery = this.getQuery(query);

    const postsDB: IPostDocument[] = await PostModel.aggregate([
      { $match: postQuery },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregatePostProject() }
    ]);

    return postsDB;
  }
  public async getPostsFromDBByAuthId(
    query: IGetPostsQuery,
    skip = 0,
    limit = 0,
    sort: Record<string, 1 | -1>,
    authId: string
  ): Promise<IPostDocument[]> {
    const postsDB: IPostDocument[] = await PostModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(authId) } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregatePostProject() }
    ]);

    return postsDB;
  }

  private aggregatePostProject(): IPostDocument {
    return {
      _id: 1,
      creator: {
        authId: '$authData._id',
        uId: '$authData.uId',
        coverPicture: '$authData.coverPicture',
        profilePicture: '$authData.profilePicture',
        name: '$authData.name',
        username: '$authData.username',
        email: '$authData.email',
        avatarColor: '$authData.avatarColor',
        createdAt: '$authData.createdAt'
      },
      post: 1,
      bgColor: 1,
      commentsCount: 1,
      files: 1,
      feelings: 1,
      gifUrl: 1,
      privacy: 1,
      createdAt: 1,
      reactions: 1,
      authId: '$authData._id'
    } as unknown as IPostDocument;
  }

  /*
   *
   * get all posts
   *
   */

  public async postCountDB(query: IGetPostsQuery): Promise<number> {
    const postQuery = this.getQuery(query);

    return await PostModel.find(postQuery).countDocuments();
  }
  /*
   *
   * get all posts
   *
   */

  public async deletePost(postId: string, authId: string): Promise<void> {
    const deletePost = PostModel.findByIdAndDelete(postId);
    const decrementPostCount = UserModel.updateOne({ authId: authId }, { $inc: { postsCount: -1 } });
    await Promise.all([deletePost, decrementPostCount]);
  }
  public async getPostById(postId: string): Promise<IPostDocument> {
    return (await PostModel.findById(postId)) as IPostDocument;
  }

  public async updatePostById(updatedPost: IPostDocument): Promise<void> {
    await PostModel.findByIdAndUpdate(updatedPost._id, updatedPost);
  }

  public async getSinglePostById(postId: string): Promise<IPostDocument> {
    const postsDB: IPostDocument[] = await PostModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregatePostProject() }
    ]);

    return postsDB[0] as unknown as IPostDocument;
  }

  /*
   *
   * get advanced query
   *
   */

  private getQuery(query: IGetPostsQuery): IGetPostsQuery {
    let postQuery = {};

    if (query.file === 'image' || query.gifUrl) {
      postQuery = {
        $or: [
          {
            files: {
              $elemMatch: {
                originalname: {
                  $regex: /\.(jpg|jpeg|png|gif)$/
                }
              }
            }
          },
          { gifUrl: { $ne: '' } }
        ]
      };
    } else if (query.file === 'video') {
      postQuery = {
        $or: [
          {
            files: {
              $elemMatch: {
                mimetype: {
                  $in: ['video/mp4', 'video/quicktime', 'video/avi']
                }
              }
            }
          }
        ]
      };
    } else {
      postQuery = query;
    }
    return postQuery;
  }
}

export const postServices: PostServices = new PostServices();
