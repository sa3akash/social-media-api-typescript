import { IFollowerData, IFollowerDocument } from '@follower/interfaces/follower.interface';
import { FollowerModel } from '@follower/models/follower.model';
import { UserModel } from '@user/models/user.model';
import mongoose from 'mongoose';
import { PushOperator, PullOperator } from 'mongodb';

class FollowerService {
  public async addFollow(authId: string, followerId: string): Promise<void> {
    const followerDoc = FollowerModel.create({ followingId: authId, followerId: followerId });
    const userUpdate = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { authId: authId },
          update: { $inc: { followingCount: 1 } }
        }
      },
      {
        updateOne: {
          filter: { authId: followerId },
          update: { $inc: { followersCount: 1 } }
        }
      }
    ]);

    await Promise.all([followerDoc, userUpdate]);
  }

  public async removeFollow(authId: string, followerId: string): Promise<void> {
    const followerDoc = FollowerModel.deleteOne({ followingId: authId, followerId: followerId });

    const userUpdate = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { authId: authId },
          update: { $inc: { followingCount: -1 } }
        }
      },
      {
        updateOne: {
          filter: { authId: followerId },
          update: { $inc: { followersCount: -1 } }
        }
      }
    ]);

    await Promise.all([followerDoc, userUpdate]);
  }

  public async checkFollow(authId: string, followerId: string): Promise<IFollowerDocument> {
    return (await FollowerModel.findOne({ followingId: authId, followerId: followerId })) as IFollowerDocument;
  }

  public async getFollowersDB(authId: string, skip: number, limit: number): Promise<IFollowerData[]> {
    const allFollowers: IFollowerData[] = FollowerModel.aggregate([
      { $match: { followerId: new mongoose.Types.ObjectId(authId) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'Auth', localField: 'followingId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregateFollowProject() }
    ]) as unknown as IFollowerData[];

    return allFollowers;
  }

  public async getFollowingDB(authId: string, skip: number, limit: number): Promise<IFollowerData[]> {
    const allFollowers: IFollowerData[] = FollowerModel.aggregate([
      { $match: { followingId: new mongoose.Types.ObjectId(authId) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'Auth', localField: 'followerId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregateFollowProject() }
    ]) as unknown as IFollowerData[];

    return allFollowers;
  }

  public async getFollowingsCountDB(authId: string): Promise<number> {
    return await FollowerModel.find({ followingId: authId }).countDocuments();
  }

  public async getFollowersCountDB(authId: string): Promise<number> {
    return await FollowerModel.find({ followerId: authId }).countDocuments();
  }

  public async blockUser(authId: string, followerId: string): Promise<void> {
    UserModel.bulkWrite([
      {
        updateOne: {
          filter: { authId: authId, blocked: { $ne: followerId } },
          update: {
            $push: {
              blocked: followerId
            } as PushOperator<Document>
          }
        }
      },
      {
        updateOne: {
          filter: { authId: followerId, blockedBy: { $ne: authId } },
          update: {
            $push: {
              blockedBy: authId
            } as PushOperator<Document>
          }
        }
      }
    ]);
  }

  public async unBlockUser(authId: string, followerId: string): Promise<void> {
    UserModel.bulkWrite([
      {
        updateOne: {
          filter: { authId: authId },
          update: {
            $pull: {
              blocked: followerId
            } as PullOperator<Document>
          }
        }
      },
      {
        updateOne: {
          filter: { authId: followerId },
          update: {
            $pull: {
              blockedBy: authId
            } as PullOperator<Document>
          }
        }
      }
    ]);
  }

  private aggregateFollowProject(): IFollowerData {
    return {
      _id: '$authData._id',
      uId: '$authData.uId',
      coverPicture: '$authData.coverPicture',
      profilePicture: '$authData.profilePicture',
      name: '$authData.name',
      username: '$authData.username',
      email: '$authData.email',
      avatarColor: '$authData.avatarColor',
      quote: '$authData.quote'
    } as unknown as IFollowerData;
  }
}

export const followerService: FollowerService = new FollowerService();
