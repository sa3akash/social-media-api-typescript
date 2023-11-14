import { AddCommentController } from '@comment/controllers/add.comment.controller';
import { GetCommentController } from '@comment/controllers/get.comment.controller';
import { authMiddleware } from '@globals/helpers/authMiddleware';
import express, { Router } from 'express';

class CommentRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/add-comment', authMiddleware.verifyUser, AddCommentController.prototype.addComment);
    this.router.get('/comments/:postId', authMiddleware.verifyUser, GetCommentController.prototype.getAllComments);
    return this.router;
  }
}

export const commentRoutes: CommentRoutes = new CommentRoutes();
