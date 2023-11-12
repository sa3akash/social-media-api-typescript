import { postCache } from '@services/cache/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { socketIoPostObject } from '@sockets/post.sockets';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class DeletePostController {
  async deletePost(req: Request, res: Response): Promise<void> {
    const postId: string = req.params.postId as string;
    // emit socket
    socketIoPostObject.emit('delete-post', postId);
    await postCache.deletePostFromCache(postId, `${req.currentUser?.id}`);
    // worker
    postQueue.deletePostJob('deletePostInDBQueue', { postId: postId, authId: `${req.currentUser?.id}` });

    res.status(HTTP_STATUS.OK).json({ message: 'Post deleted successfully.' });
  }
}
