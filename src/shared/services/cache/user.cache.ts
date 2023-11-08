import { FullUserDoc, IAuthDocument } from '@auth/interfaces/auth.interface';
import { ServerError } from '@globals/helpers/errorHandler';
import { Utils } from '@globals/helpers/utils';
import { BaseCache } from '@services/cache/base.cache';
import { IUserDocument } from '@user/interfaces/user.interface';

class UserCache extends BaseCache {
  constructor() {
    super('user-cache');
  }
  /**
   *
   * save user in cache
   *
   */
  public async saveUserToCache(authData: IAuthDocument, userData: IUserDocument): Promise<void> {
    const userInCache = {
      _id: `${userData._id}`,
      authId: `${authData._id}`,
      uId: `${authData.uId}`,
      username: `${authData.username}`,
      name: `${JSON.stringify(authData.name)}`,
      email: `${authData.email}`,
      profilePicture: `${JSON.stringify(authData.profilePicture)}`,
      coverPicture: `${JSON.stringify(authData.coverPicture)}`,
      avatarColor: `${authData.avatarColor}`,
      quote: `${authData.quote}`,
      createdAt: `${new Date()}`,
      postsCount: `${userData.postsCount}`,
      blocked: JSON.stringify(userData.blocked),
      blockedBy: JSON.stringify(userData.blockedBy),
      followersCount: `${userData.followersCount}`,
      followingCount: `${userData.followingCount}`,
      notifications: JSON.stringify(userData.notifications),
      social: JSON.stringify(userData.social),
      work: `${userData.work}`,
      school: `${userData.school}`,
      website: `${userData.website}`,
      gender: `${userData.gender}`,
      address: `${JSON.stringify(userData.address)}`,
      dob: `${JSON.stringify(userData.dob)}`
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      multi.ZADD('user', { score: parseInt(`${authData.uId}`, 10), value: `${authData._id}` });
      for (const [itemKey, itemValue] of Object.entries(userInCache)) {
        multi.HSET(`users:${authData._id}`, `${itemKey}`, `${itemValue}`);
      }

      multi.exec();
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
  /**
   *
   * get cache data for current user
   *
   */

  public async getUserByIdFromCache(authId: string): Promise<FullUserDoc> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const data: FullUserDoc = (await this.client.HGETALL(`users:${authId}`)) as unknown as FullUserDoc;

      data.dob = Utils.parseJson(`${data.dob}`);
      data.name = Utils.parseJson(`${data.name}`);
      data.coverPicture = Utils.parseJson(`${data.coverPicture}`);
      data.profilePicture = Utils.parseJson(`${data.profilePicture}`);
      data.blocked = Utils.parseJson(`${data.blocked}`);
      data.blockedBy = Utils.parseJson(`${data.blockedBy}`);
      data.social = Utils.parseJson(`${data.social}`);
      data.notifications = Utils.parseJson(`${data.notifications}`);
      data.address = Utils.parseJson(`${data.address}`);
      data.postsCount = Number(data.postsCount);
      data.followersCount = Number(data.followersCount);
      data.followingCount = Number(data.followingCount);

      return data;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
}

export const userCache: UserCache = new UserCache();
