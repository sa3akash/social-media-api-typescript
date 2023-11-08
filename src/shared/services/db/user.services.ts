import { FullUserDoc } from '@auth/interfaces/auth.interface';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.model';
import mongoose from 'mongoose';

class UserServices {
  public async addUserDataInDB(data: IUserDocument) {
    await UserModel.create(data);
  }

  public async getUserById(id: string): Promise<FullUserDoc> {
    const user: FullUserDoc[] = await UserModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(id) } }, // like findOne
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } }, // like populate return as authId return as array
      { $unwind: '$authData' }, // convert array to object with unwind
      { $project: this.aggregateProjectUser() } // return all data
    ]);
    return user[0];
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
