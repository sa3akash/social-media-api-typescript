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
    this.router.post('/comments/add', authMiddleware.verifyUser, AddCommentController.prototype.addComment);
    this.router.get('/comments/get/:postId', authMiddleware.verifyUser, GetCommentController.prototype.getAllComments);
    this.router.get('/comments/reply/:commentId', authMiddleware.verifyUser, GetCommentController.prototype.getReplies);
    this.router.delete('/comments/delete/:commentId', authMiddleware.verifyUser, AddCommentController.prototype.deleteComment);
    this.router.put('/comments/update/:commentId', authMiddleware.verifyUser, AddCommentController.prototype.updateComment);
    return this.router;
  }
}

export const commentRoutes: CommentRoutes = new CommentRoutes();
