import { authMiddleware } from '@globals/helpers/authMiddleware';
import { upload } from '@globals/helpers/cloudinaryUpload';
import { CreatePost } from '@post/controllers/create.post.controller';
import { DeletePostController } from '@post/controllers/delete.post.controller';
import { GetPostController } from '@post/controllers/get.post.controller';
import { UpdatePostController } from '@post/controllers/update.post.controller';
import express, { Router } from 'express';

class PostRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/post', authMiddleware.verifyUser, upload.array('file'), CreatePost.prototype.post);
    this.router.get('/posts', authMiddleware.verifyUser, GetPostController.prototype.getAll);
    this.router.get('/posts/user/:authId', authMiddleware.verifyUser, GetPostController.prototype.getAllByAuthId);
    this.router.get('/posts/image', authMiddleware.verifyUser, GetPostController.prototype.getAllPostWithImage);
    this.router.get('/posts/video', authMiddleware.verifyUser, GetPostController.prototype.getAllPostWithVideo);
    this.router.delete('/post/:postId', authMiddleware.verifyUser, DeletePostController.prototype.deletePost);
    this.router.put('/post/:postId', authMiddleware.verifyUser, upload.array('file'), UpdatePostController.prototype.postUpdate);
    this.router.get('/post/:postId', authMiddleware.verifyUser, GetPostController.prototype.getPostById);

    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();
