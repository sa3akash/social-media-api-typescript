import { authMiddleware } from '@globals/helpers/authMiddleware';
import { createComment, getComments, getReplies } from '@root/features/commend/controller';
import express, { Router } from 'express';

class CommentRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/add/comments', authMiddleware.verifyUser, createComment);
    this.router.get('/add/comments/:postId', authMiddleware.verifyUser, getComments);
    this.router.get('/add/comments/reply/:commentId', authMiddleware.verifyUser, getReplies);
    return this.router;
  }
}

export const commentRoutes: CommentRoutes = new CommentRoutes();
