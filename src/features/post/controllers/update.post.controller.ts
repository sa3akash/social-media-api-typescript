import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { postSchema } from '@post/schemas/post.schemas';
import { postCache } from '@services/cache/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { socketIoPostObject } from '@sockets/post.sockets';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class UpdatePostController {
  @joiValidation(postSchema)
  public async postUpdate(req: Request, res: Response): Promise<void> {
    const updatePostById = UpdatePostController.prototype.updatePost(req, req.params?.postId);
    const updatedPost: IPostDocument = await postCache.updatePostFromCache(updatePostById);
    // emit socketIO
    socketIoPostObject.emit('update-post', updatedPost);
    // update db
    postQueue.updatePostJob('updatePostInDBQueue', updatePostById);
    res.status(HTTP_STATUS.OK).json({ message: 'post updated successfully.' });
  }
  //
  // created new post for return and cache
  //
  private updatePost(req: Request, postId: string): IPostDocument {
    const { post, bgColor, privacy, feelings, gifUrl } = req.body;

    return {
      _id: postId,
      post: post || '',
      bgColor: bgColor || '',
      files: req.files ? req.files : [],
      feelings: feelings || '',
      gifUrl: gifUrl || '',
      privacy: privacy || 'Public'
    } as unknown as IPostDocument;
  }
}
