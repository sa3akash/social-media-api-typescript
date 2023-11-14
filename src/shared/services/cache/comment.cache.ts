import { ICommentDocument } from '@comment/interfaces/comment.interface';
import { ServerError } from '@globals/helpers/errorHandler';
import { BaseCache } from '@services/cache/base.cache';
import { userCache } from './user.cache';
import { FullUserDoc } from '@auth/interfaces/auth.interface';

class CommentCache extends BaseCache {
  constructor() {
    super('comment-cache');
  }

  public async addCommentCache(data: ICommentDocument): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      let commentCount: number = await this.getCommentCountCache(data.postId);
      commentCount += 1;

      await this.client.HSET(`posts:${data.postId}`, 'commentsCount', JSON.stringify(commentCount));
      await this.client.LPUSH(`comments:${data.postId}`, JSON.stringify(data));
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getAllCommentsCache(postId: string, start: number, end: number): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const commentsRowList: string[] = await this.client.LRANGE(`comments:${postId}`, start, end);

      const comments: ICommentDocument[] = [];

      for (const commentSt of commentsRowList as unknown as ICommentDocument[]) {
        const singleComment: ICommentDocument = JSON.parse(`${commentSt}`);

        const user: FullUserDoc = await userCache.getUserByIdFromCache(`${singleComment.commentedUser}`);
        singleComment.commentedUser = {
          id: `${user.authId}`,
          email: `${user.email}`,
          name: user.name,
          username: `${user.username}`,
          avatarColor: `${user.avatarColor}`,
          uId: `${user.uId}`,
          coverPicture: `${user.coverPicture}`,
          profilePicture: `${user.profilePicture}`
        };
        comments.push(singleComment);
      }

      return comments;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getAllCommentsCountCache(postId: string): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      return await this.client.LLEN(`comments:${postId}`);
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  private async getCommentCountCache(postId: string): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reactionReply: string[] = await this.client.HMGET(`posts:${postId}`, 'commentsCount');

      return JSON.parse(reactionReply[0]) as number;
    } catch (err) {
      throw new ServerError('Server Error, Try again later.');
    }
  }
}

export const commentCache: CommentCache = new CommentCache();
