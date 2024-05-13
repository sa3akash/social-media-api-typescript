import { FullUserDoc, IAuthDocument, IUpdateUserInfoDoc } from '@auth/interfaces/auth.interface';
import { IFollowerData } from '@follower/interfaces/follower.interface';
import { ServerError, UnAuthorized } from '@globals/helpers/errorHandler';
import { Utils } from '@globals/helpers/utils';
import { BaseCache } from '@services/cache/base.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { indexOf } from 'lodash';

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
      profilePicture: `${authData.profilePicture}`,
      coverPicture: `${authData.coverPicture}`,
      avatarColor: `${authData.avatarColor}`,
      quote: `${authData.quote}`,
      createdAt: `${new Date()}`,
      postsCount: `${userData.postsCount}`,
      blocked: JSON.stringify(userData.blocked),
      blockedBy: JSON.stringify(userData.blockedBy),
      relationShip: JSON.stringify(userData.relationShip),
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
      data.relationShip = Utils.parseJson(`${data.relationShip}`);
      data.postsCount = Number(data.postsCount);
      data.followersCount = Number(data.followersCount);
      data.followingCount = Number(data.followingCount);

      return data;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  /**
   *
   * update user for cache
   *
   */

  public async updateSingleUserFromCache(authId: string, field: string, value: string): Promise<FullUserDoc> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.HSET(`users:${authId}`, field, value);
      const user: FullUserDoc = (await this.getUserByIdFromCache(authId)) as FullUserDoc;
      return user;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
  public async updateUserInfoFromCache(authId: string, value: IUpdateUserInfoDoc): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const data = {
        address: JSON.stringify(value.address),
        dob: JSON.stringify(value.dob),
        relationShip: JSON.stringify(value.relationShip),
        social: JSON.stringify(value.social),
        gender: value.gender,
        school: value.school,
        website: value.website,
        quote: value.quote,
        work: value.work,
        name: JSON.stringify(value.name)
      };

      for (const [key, value] of Object.entries(data)) {
        await this.updateSingleUserFromCache(authId, key, value);
      }
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  /**
   *
   * get multiple users
   *
   */

  public async getMultipleUsersCache(start: number, end: number, excludedUserKey: string): Promise<IFollowerData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE('user', start, end, { REV: true });
      //const reply: string[] = await this.client.sendCommand(['ZREVRANGE', key, start, end]);

      const users: IFollowerData[] = [];

      for (const value of reply) {
        if (value !== excludedUserKey) {
          const user: FullUserDoc = await this.getUserByIdFromCache(value);

          const usersData: IFollowerData = {
            _id: user.authId,
            uId: user.uId,
            username: user.username,
            avatarColor: user.avatarColor,
            coverPicture: user.coverPicture,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
            quote: user.quote,
            createdAt: `${user.createdAt}`
          };

          users.push(usersData);
        }
      }

      return users;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getTotalNumberOfUsersFromCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCARD('user');
      return count || 0;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  /**
   *
   * get random user from cache
   *
   */

  public async getRandomUsersFromCache(authId: string): Promise<IFollowerData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // get all followers ids
      const following: string[] = await this.client.LRANGE(`following:${authId}`, 0, -1);
      // get all soted set of user
      const users: string[] = await this.client.ZRANGE('user', 0, -1);
      const randomUsers: string[] = Utils.randomGet(users).slice(0, 10);

      const randomUserList: IFollowerData[] = [];
      for (const key of randomUsers) {
        const followerIndex = indexOf(following, key);
        if (followerIndex < 0 && key !== authId) {
          const user: FullUserDoc = await this.getUserByIdFromCache(key);
          const randomUserData: IFollowerData = {
            _id: user.authId,
            uId: user.uId,
            username: user.username,
            avatarColor: user.avatarColor,
            coverPicture: user.coverPicture,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
            quote: user.quote,
            createdAt: `${user.createdAt}`
          };
          randomUserList.push(randomUserData);
        }
      }
      // const excludedUserIndex: number = findIndex(randomUserList, ['_id', authId]);
      // randomUserList.splice(excludedUserIndex, 1);

      return randomUserList;
    } catch (error) {
      throw new ServerError('Server error. Try again.');
    }
  }

  /**
   *
   * get multiple users
   *
   */

  public async getLoginData(authId: string): Promise<{
    following: string[];
    followers: string[];
    blocked: string[];
  }> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // get all followers ids
      const following: string[] = await this.client.LRANGE(`following:${authId}`, 0, -1);
      const followers: string[] = await this.client.LRANGE(`followers:${authId}`, 0, -1);

      // get all soted set of user
      const blockedUsers: IUserDocument = await this.getUserByIdFromCache(authId);

      if (!blockedUsers._id) {
        throw new UnAuthorized('Unathorized user.');
      }

      const blocked: string[] = blockedUsers.blocked as unknown as string[];

      return {
        following,
        followers,
        blocked
      };
    } catch (error) {
      throw new ServerError('Server error. Try again.');
    }
  }
}

export const userCache: UserCache = new UserCache();
