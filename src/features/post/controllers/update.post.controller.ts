import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { postSchema } from '@post/schemas/post.schemas';
import { postCache } from '@services/cache/post.cache';
import { postServices } from '@services/db/post.services';
import { postQueue } from '@services/queues/post.queue';
import { socketIoPostObject } from '@sockets/post.sockets';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class UpdatePostController {
  @joiValidation(postSchema)
  public async postUpdate(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, feelings, gifUrl } = req.body;

    const getSinglePostCache = await postCache.getPostByIdFromCache(`${req.params?.postId}`);

    const getPostById: IPostDocument = getSinglePostCache
      ? getSinglePostCache
      : await postServices.getSinglePostById(`${req.params?.postId}`);

    if (!getPostById) {
      throw new BadRequestError('Post not found.');
    }

    const updatePostDoc: IPostDocument = {
      ...getPostById,
      post: post || getPostById.post,
      bgColor: bgColor || getPostById.bgColor,
      privacy: privacy || getPostById.privacy,
      feelings: feelings || getPostById.feelings,
      gifUrl: gifUrl || getPostById.gifUrl,
      files: req.files || getPostById.files
    } as unknown as IPostDocument;
    await postCache.updatePostFromCache(updatePostDoc);
    // // emit socketIO
    socketIoPostObject.emit('update-post', updatePostDoc);
    // // update db
    postQueue.updatePostJob('updatePostInDBQueue', updatePostDoc);
    res.status(HTTP_STATUS.OK).json({ message: 'post updated successfully.' });
  }
}
