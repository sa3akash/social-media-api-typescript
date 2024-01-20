import { BadRequestError, ServerError } from '@globals/helpers/errorHandler';
import { Utils } from '@globals/helpers/utils';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { BaseCache } from '@services/cache/base.cache';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import { userCache } from '@services/cache/user.cache';
import { FullUserDoc } from '@auth/interfaces/auth.interface';

export type PostCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IPostDocument | IPostDocument[];

class PostCache extends BaseCache {
  constructor() {
    super('post-cache');
  }

  /*
   *
   * save post cache
   *
   */

  public async savePostToCache(data: IPostDocument): Promise<void> {
    const postInCache = {
      _id: `${data._id}`,
      authId: `${data.authId}`,
      post: `${data.post}`,
      bgColor: `${data.bgColor}`,
      commentsCount: `${data.commentsCount}`,
      feelings: `${data.feelings}`,
      gifUrl: `${data.gifUrl}`,
      privacy: `${data.privacy}`,
      files: `${JSON.stringify(data.files)}`,
      reactions: `${JSON.stringify(data.reactions)}`,
      createdAt: `${data.createdAt}`
    } as unknown as IPostDocument;

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // get user and increment postsCount property
      const postCount: string[] = await this.client.HMGET(`users:${data.authId}`, 'postsCount');

      // multiple exicutes
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      // add post in cache
      multi.ZADD('post', { score: parseInt(`${data.uId}`, 10), value: `${data._id}` });
      for (const [itemKey, itemValue] of Object.entries(postInCache)) {
        multi.HSET(`posts:${data._id}`, `${itemKey}`, `${itemValue}`);
      }
      // increment post count
      const count: number = parseInt(postCount[0], 10) + 1;
      multi.HSET(`users:${data.authId}`, 'postsCount', count);

      multi.exec();
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  /*
   *
   * get post cache with pagination
   *
   */

  public async getPostFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      //const reply: string[] = await this.client.sendCommand(['ZREVRANGE', key, start, end]);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const posts: IPostDocument[] = [];

      for (const post of replies as IPostDocument[]) {
        const user: FullUserDoc = await userCache.getUserByIdFromCache(`${post.authId}`);
        (post.creator = {
          authId: `${post.authId}`,
          avatarColor: user.avatarColor,
          coverPicture: user.coverPicture,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          uId: user.uId,
          username: user.username,
          createdAt: `${user.createdAt}`
        }),
          (post.commentsCount = Number(`${post.commentsCount}`));
        post.files = Utils.parseJson(`${post.files}`);
        post.reactions = Utils.parseJson(`${post.reactions}`);
        post.createdAt = new Date(`${post.createdAt}`);
        posts.push(post);
      }

      return posts.sort((a, b) => {
        const createdAtA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const createdAtB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return createdAtB - createdAtA;
      });
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
  /*
   *
   * get number of total post cache
   *
   */

  public async getTotalNumberOfPostFromCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCARD('post');
      return count;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getPostByIdFromCache(postId: string): Promise<IPostDocument> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const postReply: Record<string, string> | null = await this.client.HGETALL(`posts:${postId}`);
      if (!postReply?._id) {
        throw new BadRequestError('Post not found.');
      }

      const user: FullUserDoc | undefined = await userCache.getUserByIdFromCache(`${postReply.authId}`);

      const postObject: IPostDocument = {
        _id: postReply._id || '',
        creator: {
          authId: `${postReply.authId}`,
          avatarColor: user.avatarColor,
          coverPicture: user.coverPicture,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          uId: user.uId,
          username: user.username,
          createdAt: `${user.createdAt}`

        },
        post: postReply.post,
        bgColor: postReply.bgColor,
        commentsCount: Number(postReply.commentsCount),
        files: JSON.parse(postReply.files),
        feelings: postReply.feelings,
        gifUrl: postReply.gifUrl,
        privacy: postReply.privacy,
        reactions: JSON.parse(postReply.reactions),
        createdAt: postReply.createdAt
      } as unknown as IPostDocument;

      return postObject;
    } catch (err) {
      console.log(err);
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  /*
   *
   * get post cache with pagination with images
   *
   */

  public async getPostFromCacheImages(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      //const reply: string[] = await this.client.sendCommand(['ZREVRANGE', key, start, end]);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postsWithImages: IPostDocument[] = [];

      for (const post of replies as IPostDocument[]) {
        post.files = Utils.parseJson(`${post.files}`);

        if (post.files.some((f) => f?.originalname.match(/\.(jpg|jpeg|png|gif)$/)) || post.gifUrl) {
          const user: FullUserDoc = await userCache.getUserByIdFromCache(`${post.authId}`);
          (post.creator = {
            authId: `${post.authId}`,
            avatarColor: user.avatarColor,
            coverPicture: user.coverPicture,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
            uId: user.uId,
            username: user.username,
            createdAt: `${user.createdAt}`
          }),
            (post.commentsCount = Number(`${post.commentsCount}`));
          post.reactions = Utils.parseJson(`${post.reactions}`);
          post.createdAt = new Date(`${post.createdAt}`);
          postsWithImages.push(post);
        }
      }

      return postsWithImages.sort((a, b) => {
        const createdAtA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const createdAtB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return createdAtB - createdAtA;
      });
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
  /*
   *
   * get post cache with pagination with videos
   *
   */

  public async getPostFromCacheVideos(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      //const reply: string[] = await this.client.sendCommand(['ZREVRANGE', key, start, end]);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postsWithVideos: IPostDocument[] = [];

      for (const post of replies as IPostDocument[]) {
        post.files = Utils.parseJson(`${post.files}`);

        if (post.files && post.files.some((f) => f.originalname.match(/\.(mp4|mov|avi)$/))) {
          const user: FullUserDoc = await userCache.getUserByIdFromCache(`${post.authId}`);
          (post.creator = {
            authId: `${post.authId}`,
            avatarColor: user.avatarColor,
            coverPicture: user.coverPicture,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
            uId: user.uId,
            username: user.username,
            createdAt: `${user.createdAt}`

          }),
            (post.commentsCount = Number(`${post.commentsCount}`));
          post.reactions = Utils.parseJson(`${post.reactions}`);
          post.createdAt = new Date(`${post.createdAt}`);
          postsWithVideos.push(post);
        }
      }

      return postsWithVideos.sort((a, b) => {
        const createdAtA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const createdAtB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return createdAtB - createdAtA;
      });
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
  /*
   *
   * get user post cache with pagination with videos
   *
   */

  public async getUserPostFromCache(key: string, uId: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, uId, uId, { REV: true, BY: 'SCORE' });
      //const reply: string[] = await this.client.sendCommand(['ZREVRANGE', key, start, end]);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const userPost: IPostDocument[] = [];

      for (const post of replies as IPostDocument[]) {
        const user: FullUserDoc = await userCache.getUserByIdFromCache(`${post.authId}`);
        (post.creator = {
          authId: `${post.authId}`,
          avatarColor: user.avatarColor,
          coverPicture: user.coverPicture,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          uId: user.uId,
          username: user.username,
          createdAt: `${user.createdAt}`

        }),
          (post.commentsCount = Number(`${post.commentsCount}`));
        post.files = Utils.parseJson(`${post.files}`);
        post.reactions = Utils.parseJson(`${post.reactions}`);
        post.createdAt = new Date(`${post.createdAt}`);
        userPost.push(post);
      }

      return userPost.sort((a, b) => {
        const createdAtA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const createdAtB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return createdAtB - createdAtA;
      });
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
  /*
   *
   * get user number of total post cache
   *
   */

  public async getTotalUserPostFromCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCOUNT('post', uId, uId);
      return count;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  /*
   *
   * get user post cache with pagination with videos
   *
   */

  public async deletePostFromCache(postId: string, authId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const postCount: string[] = await this.client.HMGET(`users:${authId}`, 'postsCount');

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      multi.ZREM('post', `${postId}`);
      multi.DEL(`posts:${postId}`);
      multi.DEL(`comments:${postId}`);
      multi.DEL(`reactions:${postId}`);

      const count: number = parseInt(postCount[0], 10) - 1;
      multi.HSET(`users:${authId}`, ['postsCount', count]);

      multi.exec();
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  /*
   *
   * update post
   *
   */

  public async updatePostFromCache(updatedPost: IPostDocument): Promise<void> {
    const postInCache = {
      _id: `${updatedPost._id}`,
      authId: `${updatedPost.creator?.authId}`,
      post: `${updatedPost.post}`,
      bgColor: `${updatedPost.bgColor}`,
      commentsCount: `${updatedPost.commentsCount}`,
      feelings: `${updatedPost.feelings}`,
      gifUrl: `${updatedPost.gifUrl}`,
      privacy: `${updatedPost.privacy}`,
      files: `${JSON.stringify(updatedPost.files)}`,
      reactions: `${JSON.stringify(updatedPost.reactions)}`,
      createdAt: `${updatedPost.createdAt}`
    } as unknown as IPostDocument;

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // multiple exicutes
      for (const [itemKey, itemValue] of Object.entries(postInCache)) {
        await this.client.HSET(`posts:${updatedPost._id}`, `${itemKey}`, `${itemValue}`);
      }
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
}

export const postCache: PostCache = new PostCache();
