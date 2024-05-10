import { FullUserDoc } from '@auth/interfaces/auth.interface';
import { ServerError } from '@globals/helpers/errorHandler';
import { Utils } from '@globals/helpers/utils';
import { IReactionDocument, IReactions, IReactionsGet, IReactionsSingle } from '@reaction/interfaces/reaction.interface';
import { BaseCache } from '@services/cache/base.cache';
import { filter, find } from 'lodash';
import { userCache } from '@services/cache/user.cache';

class ReactionCache extends BaseCache {
  constructor() {
    super('reaction-cache');
  }

  public async addReactionInCache(reactionDocument: IReactionDocument): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reactionCount: IReactions = await this.getPostReactionCacheCount(reactionDocument.postId);
      // if not react then add new reaction

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      if (reactionDocument.type) {
        reactionCount[reactionDocument.type as keyof IReactions] += 1;
        multi.LPUSH(`reactions:${reactionDocument.postId}`, JSON.stringify(reactionDocument));
        // update post
        multi.HSET(`posts:${reactionDocument.postId}`, 'reactions', JSON.stringify(reactionCount));
      }
      multi.exec();
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  /**
   *
   * updateReactionFromCache
   *
   */

  public async updateReactionFromCache(previosReactionDoc: IReactionDocument, type: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      if (previosReactionDoc.type === type) {
        // remove
        const reactionCount: IReactions = await this.getPostReactionCacheCount(previosReactionDoc.postId);
        reactionCount[previosReactionDoc.type as keyof IReactions] -= 1;
        multi.HSET(`posts:${previosReactionDoc.postId}`, 'reactions', JSON.stringify(reactionCount));
        multi.LREM(`reactions:${previosReactionDoc.postId}`, 1, JSON.stringify(previosReactionDoc));
      } else {
        const reactionCount: IReactions = await this.getPostReactionCacheCount(previosReactionDoc.postId);
        reactionCount[previosReactionDoc.type as keyof IReactions] -= 1;
        // update
        const updateData: IReactionDocument = {
          ...previosReactionDoc,
          type: type
        } as IReactionDocument;
        reactionCount[updateData.type as keyof IReactions] += 1;
        multi.HSET(`posts:${updateData.postId}`, 'reactions', JSON.stringify(reactionCount));

        multi.LREM(`reactions:${previosReactionDoc.postId}`, 1, JSON.stringify(previosReactionDoc));
        multi.LPUSH(`reactions:${updateData.postId}`, JSON.stringify(updateData));
      }
      multi.exec();
    } catch (err) {
      throw new ServerError('Server Error, Try again later.');
    }
  }

  /**
   *
   * get previous reaction
   *
   */

  public async getPreviousReactions(postId: string, authId: string): Promise<IReactionDocument | undefined> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
      const list: IReactionDocument[] = [];

      for (const item of response) {
        list.push(Utils.parseJson(item) as IReactionDocument);
      }
      return find(list, (listItem: IReactionDocument) => listItem.authId === authId);
    } catch (err) {
      throw new ServerError('Server Error, Try again later.');
    }
  }

  /**
   *
   * getPostReactionCacheCount
   *
   */

  private async getPostReactionCacheCount(postId: string): Promise<IReactions> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reactionReply: string[] = await this.client.HMGET(`posts:${postId}`, 'reactions');

      return JSON.parse(reactionReply[0]) as IReactions;
    } catch (err) {
      throw new ServerError('Server Error, Try again later.');
    }
  }

  /**
   *
   * get reactions
   *
   */

  public async getAllReactionsCache(postId: string, start: number, end: number): Promise<IReactionsGet> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reactionCount: number = await this.client.LLEN(`reactions:${postId}`);
      const allReactions: string[] = await this.client.LRANGE(`reactions:${postId}`, start, end);

      const reactionList: IReactionDocument[] = [];

      for (const item of allReactions) {
        const reactionObject: IReactionDocument = JSON.parse(item);
        const user: FullUserDoc = await userCache.getUserByIdFromCache(`${reactionObject.authId}`);
        (reactionObject.creator = {
          authId: `${reactionObject.authId}`,
          avatarColor: user.avatarColor,
          coverPicture: user.coverPicture,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          uId: user.uId,
          username: user.username,
          createdAt: `${user.createdAt}`
        }),
          reactionList.push(reactionObject);
      }

      const reactionData = reactionList.sort((a, b) => {
        const createdAtA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const createdAtB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return createdAtB - createdAtA;
      });

      return {
        reactions: reactionData.length ? reactionData : [],
        reactionsCount: reactionCount || 0
      } as unknown as IReactionsGet;
    } catch (err) {
      throw new ServerError('Server Error, Try again later.');
    }
  }

  /**
   *
   * getReactionsByAuthIdAndPostIdCache
   *
   */

  public async getReactionsByAuthIdAndPostIdCache(postId: string, authId: string): Promise<IReactionsSingle> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const allReactions: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);

      const reactionList: IReactionDocument[] = [];

      for (const item of allReactions) {
        reactionList.push(JSON.parse(item));
      }

      const result: IReactionDocument | undefined = find(reactionList, (reaction: IReactionDocument) => {
        return reaction.postId === postId && reaction.authId === authId;
      });

      if (result) {
        const user: FullUserDoc = await userCache.getUserByIdFromCache(`${result.authId}`);
        result.creator = {
          authId: `${user._id}`,
          avatarColor: user.avatarColor,
          coverPicture: user.coverPicture,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          uId: user.uId,
          username: user.username,
          createdAt: `${user.createdAt}`
        };
      }

      return result?._id
        ? {
            reaction: result,
            reactionCount: 1
          }
        : ({} as unknown as IReactionsSingle);
    } catch (err) {
      throw new ServerError('Server Error, Try again later.');
    }
  }

  /**
   *
   * getReactionsByTypeAndPostId
   *
   */

  public async getReactionsByPostIdAndTypeCache(postId: string, type: string, start: number, end: number): Promise<IReactionsGet> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const allReactions: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);

      const reactionList: IReactionDocument[] = [];

      for (const item of allReactions) {
        const reactionObject: IReactionDocument = JSON.parse(item);
        const user: FullUserDoc = await userCache.getUserByIdFromCache(`${reactionObject.authId}`);
        (reactionObject.creator = {
          authId: `${reactionObject.authId}`,
          avatarColor: user.avatarColor,
          coverPicture: user.coverPicture,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          uId: user.uId,
          username: user.username,
          createdAt: `${user.createdAt}`
        }),
          reactionList.push(reactionObject);
      }

      const result: IReactionDocument[] | undefined = filter(reactionList, (reaction: IReactionDocument) => reaction.type === type);

      return {
        reactions: result.length ? result.slice(start, end) : [],
        reactionsCount: result.length || 0
      } as unknown as IReactionsGet;
    } catch (err) {
      throw new ServerError('Server Error, Try again later.');
    }
  }
}

export const reactionCache: ReactionCache = new ReactionCache();
