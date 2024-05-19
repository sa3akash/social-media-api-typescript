import { BadRequestError } from '@globals/helpers/errorHandler';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { postCache } from '@services/cache/post.cache';
import { postServices } from '@services/db/post.services';
import { postQueue } from '@services/queues/post.queue';
import { socketIoPostObject } from '@sockets/post.sockets';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class DeletePostController {
  async deletePost(req: Request, res: Response): Promise<void> {
    const postId: string = req.params.postId as string;

    const getSinglePostCache = await postCache.getPostByIdFromCache(`${req.params?.postId}`);

    const getPostById: IPostDocument = getSinglePostCache
      ? getSinglePostCache
      : await postServices.getSinglePostById(`${req.params?.postId}`);

    if (!getPostById) {
      throw new BadRequestError('Post not found.');
    }

    // emit socket
    socketIoPostObject.emit('delete-post', postId, `${req.currentUser?.id}`);

    await postCache.deletePostFromCache(postId, `${req.currentUser?.id}`);
    // worker
    postQueue.deletePostJob('deletePostInDBQueue', { postId: postId, authId: `${req.currentUser?.id}` });

    res.status(HTTP_STATUS.OK).json({ message: 'Post deleted successfully.' });
  }
}
