import { FullUserDoc } from '@auth/interfaces/auth.interface';
import { IFollowerData } from '@follower/interfaces/follower.interface';
import { followerCache } from '@services/cache/follower.cache';
import { userCache } from '@services/cache/user.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { socketIoFollowObject } from '@sockets/follower.socket';
import { followQueue } from '@services/queues/follow.queue';
import { followerService } from '@services/db/follower.services';
import { BadRequestError } from '@globals/helpers/errorHandler';

export class AddFollowerController {
  public async follow(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;

    if (`${req.currentUser?.id}` === `${followerId}`) {
      throw new BadRequestError('Your can not follow yourself.');
    }

    const checkFollowingCache = await followerCache.checkFollower(`following:${req.currentUser?.id}`, `${followerId}`);
    const checkFollowing = checkFollowingCache
      ? checkFollowingCache
      : await followerService.checkFollow(`${req.currentUser?.id}`, `${followerId}`);

    if (checkFollowing) {
      await followerCache.removeFollowerCache(`${req.currentUser?.id}`, `${followerId}`);
      // send user details to frontend for updates with socketIo
      socketIoFollowObject.emit('remove-follow', `${followerId}`);
      // remove follower from db with queue
      // send data in queue
      followQueue.removeFollowJob('removeFollowSaveInDB', {
        keyOne: `${req.currentUser?.id}`,
        keyTwo: `${followerId}`
      });
    } else {
      //  update follower count from cache
      await followerCache.saveFollowerCache(`${req.currentUser?.id}`, `${followerId}`);
      // add follower and following to cache
      const cachedFollowerUser: FullUserDoc = await userCache.getUserByIdFromCache(followerId);
      // prepire userObject
      const followerData: IFollowerData = AddFollowerController.prototype.userData(cachedFollowerUser);
      // send data to socketId
      socketIoFollowObject.emit('add-follow', followerData);
      // send data in queue
      followQueue.addFollowJob('addFollowSaveInDB', {
        keyOne: `${req.currentUser?.id}`,
        keyTwo: `${followerId}`
      });
    }
    res.status(HTTP_STATUS.OK).json({ message: 'Following user updates.' });
  }

  private userData(user: FullUserDoc): IFollowerData {
    return {
      _id: user.authId,
      uId: user.uId,
      username: user.username,
      avatarColor: user.avatarColor,
      coverPicture: user.coverPicture,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      quote: user.quote
    };
  }
}
