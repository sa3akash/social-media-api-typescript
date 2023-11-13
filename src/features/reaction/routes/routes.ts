import { authMiddleware } from '@globals/helpers/authMiddleware';
import { AddReactionController } from '@reaction/controllers/add.reaction.controller';
import { GetReactionController } from '@reaction/controllers/get.reaction.controller';
import express, { Router } from 'express';

class ReactionRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/post/reaction/single/:postId', authMiddleware.verifyUser, GetReactionController.prototype.getSingleReactionByAuthId);
    this.router.get('/post/reactions/user', authMiddleware.verifyUser, GetReactionController.prototype.getAllReactionSpacifcUser);
    this.router.get('/post/reactions/:postId', authMiddleware.verifyUser, GetReactionController.prototype.getAll);
    this.router.get('/post/reaction/:postId', authMiddleware.verifyUser, GetReactionController.prototype.getByType);
    this.router.post('/post/reaction', authMiddleware.verifyUser, AddReactionController.prototype.add);

    return this.router;
  }
}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes();
