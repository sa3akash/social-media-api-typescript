import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { followerCache } from '@services/cache/follower.cache';
import { IFollowerData } from '@follower/interfaces/follower.interface';
import { followerService } from '@services/db/follower.services';

const PAGE_SIZE = 10;

export class GetFollowerController {
  async getFollower(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const newSkip: number = skip === 0 ? skip : skip + 1;

    const followersCache: IFollowerData[] = await followerCache.getFollowerCache(`${req.currentUser?.id}`, newSkip, limit);
    const followersCountCache: number = await followerCache.getFollowerCountCache(`${req.currentUser?.id}`);

    // response
    res.status(HTTP_STATUS.OK).json({
      message: 'Followers users get successfully.',
      users: followersCache,
      currentPage: Number(page),
      numberOfPages: Math.ceil(followersCountCache / PAGE_SIZE)
    });
  }

  async getFollowing(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const newSkip: number = skip === 0 ? skip : skip + 1;

    const followingCache: IFollowerData[] = await followerCache.getFollowingCache(`${req.currentUser?.id}`, newSkip, limit);
    const followingCountCache: number = await followerCache.getFollowingCountCache(`${req.currentUser?.id}`);

    const followings = followingCache ? followingCache : await followerService.getFollowingDB(`${req.currentUser?.id}`, skip, limit);
    const followingsCount = followingCountCache
      ? followingCountCache
      : await followerService.getFollowingsCountDB(`${req.currentUser?.id}`);

    // response
    res.status(HTTP_STATUS.OK).json({
      message: 'Followings users get successfully.',
      users: followings,
      currentPage: Number(page),
      numberOfPages: Math.ceil(followingsCount / PAGE_SIZE)
    });
  }
}
