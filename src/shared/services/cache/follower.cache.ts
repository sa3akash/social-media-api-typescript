import { FullUserDoc } from '@auth/interfaces/auth.interface';
import { IFollowerData } from '@follower/interfaces/follower.interface';
import { ServerError } from '@globals/helpers/errorHandler';
import { BaseCache } from '@services/cache/base.cache';
import { userCache } from '@services/cache/user.cache';
import { remove } from 'lodash';

class FollowerCache extends BaseCache {
  constructor() {
    super('followe-cache');
  }

  public async saveFollowerCache(authId: string, followerId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const followersCount: Promise<void> = this.updateFollowerCountCache(followerId, 'followersCount', 1);
      const followingCount: Promise<void> = this.updateFollowerCountCache(authId, 'followingCount', 1);

      const saveFollowing = this.client.LPUSH(`following:${authId}`, followerId);
      const savefollower = this.client.LPUSH(`followers:${followerId}`, authId);

      await Promise.all([followersCount, followingCount, saveFollowing, savefollower]);
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async removeFollowerCache(authId: string, followerId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const followersCount: Promise<void> = this.updateFollowerCountCache(followerId, 'followersCount', -1);
      const followingCount: Promise<void> = this.updateFollowerCountCache(authId, 'followingCount', -1);

      const saveFollowing = this.client.LREM(`following:${authId}`, 1, followerId);
      const savefollower = this.client.LREM(`followers:${followerId}`, 1, authId);

      await Promise.all([followersCount, followingCount, saveFollowing, savefollower]);
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async updateFollowerCountCache(authId: string, field: string, value: number): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.HINCRBY(`users:${authId}`, field, value);
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async checkFollower(key: string, checkId: string): Promise<boolean> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const followerRow: string[] = await this.client.LRANGE(key, 0, -1);

      return followerRow.some((i) => i === checkId);
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getFollowerCache(authId: string, start: number, end: number): Promise<IFollowerData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const allFollowers: string[] = await this.client.LRANGE(`followers:${authId}`, start, end);

      const followersList: IFollowerData[] = [];

      for (const authId of allFollowers) {
        const user: FullUserDoc = await userCache.getUserByIdFromCache(`${authId}`);

        const followerData: IFollowerData = {
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

        followersList.push(followerData);
      }

      return followersList;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getFollowingCache(authId: string, start: number, end: number): Promise<IFollowerData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const allFollowing: string[] = await this.client.LRANGE(`following:${authId}`, start, end);

      const followingList: IFollowerData[] = [];

      for (const authId of allFollowing) {
        const user: FullUserDoc = await userCache.getUserByIdFromCache(`${authId}`);

        const followingData: IFollowerData = {
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

        followingList.push(followingData);
      }

      return followingList;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getFollowerCountCache(authId: string): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const allFollowersCount: number = await this.client.LLEN(`followers:${authId}`);

      return allFollowersCount;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getFollowingCountCache(authId: string): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const allFollowingCount: number = await this.client.LLEN(`following:${authId}`);
      return allFollowingCount;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async updateBlockUsers(authId: string, type: 'block' | 'unblock', field: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string = (await this.client.HGET(`users:${authId}`, field)) as string;
      let blocked: string[] = JSON.parse(`${response}`) as string[];

      if (type === 'block') {
        if (!blocked.some((id) => id === value)) {
          blocked = [...blocked, value];
        }
      } else {
        remove(blocked, (id: string) => id === value);
        blocked = [...blocked];
      }
      await this.client.HSET(`users:${authId}`, `${field}`, JSON.stringify(blocked));
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
}

export const followerCache: FollowerCache = new FollowerCache();
