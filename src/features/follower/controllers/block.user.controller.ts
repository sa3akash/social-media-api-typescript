import { BadRequestError } from '@globals/helpers/errorHandler';
import { followerCache } from '@services/cache/follower.cache';
import { followQueue } from '@services/queues/follow.queue';
import { socketIoFollowObject } from '@sockets/follower.socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class BlockUserController {
  public async block(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;
    if (`${req.currentUser?.id}` === `${followerId}`) {
      throw new BadRequestError('Your can not follow yourself.');
    }

    // block user
    socketIoFollowObject.emit('block-user', `${followerId}`);

    BlockUserController.prototype.updateBlockedUser(`${req.currentUser!.id}`, 'block', `${followerId}`);

    followQueue.blockUserJob('blockUserInDB', {
      keyOne: `${req.currentUser!.id}`,
      keyTwo: `${followerId}`,
      type: 'block'
    });

    res.status(HTTP_STATUS.OK).json({ message: 'User blocked' });
  }

  public async unBlock(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;
    if (`${req.currentUser?.id}` === `${followerId}`) {
      throw new BadRequestError('Your can not follow yourself.');
    }
    // block user
    socketIoFollowObject.emit('unblock-user', `${followerId}`);

    BlockUserController.prototype.updateBlockedUser(`${req.currentUser!.id}`, 'unblock', `${followerId}`);
    followQueue.blockUserJob('blockUserInDB', {
      keyOne: `${req.currentUser!.id}`,
      keyTwo: `${followerId}`,
      type: 'unblock'
    });

    res.status(HTTP_STATUS.OK).json({ message: 'User blocked' });
  }

  private async updateBlockedUser(authId: string, type: 'block' | 'unblock', followerId: string): Promise<void> {
    const blocked: Promise<void> = followerCache.updateBlockUsers(`${authId}`, type, 'blocked', `${followerId}`);
    const blockedBy: Promise<void> = followerCache.updateBlockUsers(`${followerId}`, type, 'blockedBy', `${authId}`);
    await Promise.all([blocked, blockedBy]);
  }
}
