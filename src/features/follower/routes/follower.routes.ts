import { AddFollowerController } from '@follower/controllers/add.follower.controller';
import { BlockUserController } from '@follower/controllers/block.user.controller';
import { GetFollowerController } from '@follower/controllers/get.follower.controller';
import { authMiddleware } from '@globals/helpers/authMiddleware';
import express, { Router } from 'express';

class FollowRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.put('/user/follow/:followerId', authMiddleware.verifyUser, AddFollowerController.prototype.follow);
    this.router.get('/user/followers', authMiddleware.verifyUser, GetFollowerController.prototype.getFollower);
    this.router.get('/user/followings', authMiddleware.verifyUser, GetFollowerController.prototype.getFollowing);
    this.router.put('/user/block/:followerId', authMiddleware.verifyUser, BlockUserController.prototype.block);
    this.router.put('/user/unblock/:followerId', authMiddleware.verifyUser, BlockUserController.prototype.unBlock);

    return this.router;
  }
}

export const followRoutes: FollowRoutes = new FollowRoutes();
