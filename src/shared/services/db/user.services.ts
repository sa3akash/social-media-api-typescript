import { FullUserDoc, IAuthDocument, IUpdateUserInfoDoc } from '@auth/interfaces/auth.interface';
import { AuthModel } from '@auth/models/auth.db.model';
import { IFollowerData } from '@follower/interfaces/follower.interface';
import { followerCache } from '@services/cache/follower.cache';
import { ISearchUser, IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.model';
import mongoose from 'mongoose';

class UserServices {
  public async addUserDataInDB(data: IUserDocument) {
    await UserModel.create(data);
  }

  public async getUserById(id: string): Promise<FullUserDoc> {
    const user: FullUserDoc[] = await UserModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(id) } }, // like findOne
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregateProjectUser() } // return all data
    ]);
    return user[0];
  }

  public async getAllUsers(skip: number, limit: number, authId: string): Promise<IFollowerData[]> {
    const users: FullUserDoc[] = await AuthModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(authId) } } }, // like findOne
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 1,
          uId: 1,
          coverPicture: 1,
          profilePicture: 1,
          name: 1,
          username: 1,
          email: 1,
          avatarColor: 1,
          quote: 1
        }
      }
    ]);
    return users;
  }

  public async getRandomAllUsers(authId: string): Promise<IFollowerData[]> {
    const users: IAuthDocument[] = await AuthModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(authId) } } }, // like find
      { $sample: { size: 10 } },
      {
        $project: {
          _id: 1,
          uId: 1,
          coverPicture: 1,
          profilePicture: 1,
          name: 1,
          username: 1,
          email: 1,
          avatarColor: 1,
          quote: 1
        }
      }
    ]);

    const randomUsers: IFollowerData[] = [];

    const followingUser: IFollowerData[] = await followerCache.getFollowingCache(authId, 0, -1);

    for (const user of users) {
      const followingExist = followingUser.some((f: IFollowerData) => f._id === `${user._id}`);
      if (!followingExist) {
        randomUsers.push(user);
      }
    }

    return randomUsers;
  }

  public async getNumberOfUsers(): Promise<number> {
    return await UserModel.find({}).countDocuments();
  }

  async searchUsers(regex: RegExp, skip: number, limit: number, authId: string): Promise<ISearchUser[]> {
    const users: ISearchUser[] = await AuthModel.aggregate([
      {
        $match: {
          $and: [
            { $or: [{ username: regex }, { 'name.first': regex }, { 'name.last': regex }] },
            { _id: { $ne: new mongoose.Types.ObjectId(authId) } }
          ]
        }
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          uId: 1,
          coverPicture: 1,
          profilePicture: 1,
          name: 1,
          username: 1,
          email: 1,
          avatarColor: 1,
          quote: 1
        }
      }
    ]);
    return users;
  }

  /**
   *
   * update password
   *
   */
  public async updatePassword(authId: string, hashedPassword: string): Promise<void> {
    await AuthModel.findByIdAndUpdate(authId, { $set: { password: hashedPassword } });
  }
  /**
   *
   * update password
   *
   */
  public async updateUserInfo(authId: string, data: IUpdateUserInfoDoc): Promise<void> {
    await UserModel.updateOne({ authId: authId }, { $set: data });
    if (data.quote) {
      await AuthModel.findByIdAndUpdate(authId, { $set: { quote: data.quote } });
    }
  }

  private aggregateProjectUser(): FullUserDoc {
    return {
      _id: 1,
      authId: 1,
      uId: '$authData.uId',
      coverPicture: '$authData.coverPicture',
      profilePicture: '$authData.profilePicture',
      name: '$authData.name',
      username: '$authData.username',
      email: '$authData.email',
      quote: '$authData.quote',
      avatarColor: '$authData.avatarColor',
      postsCount: 1,
      work: 1,
      school: 1,
      website: 1,
      gender: 1,
      blocked: 1,
      blockedBy: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      address: 1,
      dob: 1,
      createdAt: 1
    } as unknown as FullUserDoc;
  }
}

export const userService: UserServices = new UserServices();
