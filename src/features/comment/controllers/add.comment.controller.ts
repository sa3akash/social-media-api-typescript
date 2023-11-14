import { ICommentDocument } from '@comment/interfaces/comment.interface';
import { commentCache } from '@services/cache/comment.cache';
import { commentQueue } from '@services/queues/comment.queue';
import { socketIoPostObject } from '@sockets/post.sockets';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

export class AddCommentController {
  public async addComment(req: Request, res: Response): Promise<void> {
    const { postId, comment } = req.body;

    const commentData: ICommentDocument = {
      _id: new ObjectId(),
      postId: `${postId}`,
      comment: `${comment}`,
      commentedUser: `${req.currentUser?.id}`,
      createdAt: new Date()
    } as ICommentDocument;
    // send all user in this comment
    socketIoPostObject.emit('add-comment', {
      _id: commentData._id,
      postId: commentData.postId,
      comment: commentData.comment,
      commentedUser: {
        id: `${req.currentUser?.id}`,
        avatarColor: `${req.currentUser?.avatarColor}`,
        coverPicture: `${req.currentUser?.coverPicture}`,
        email: `${req.currentUser?.email}`,
        name: `${req.currentUser?.name}`,
        profilePicture: `${req.currentUser?.profilePicture}`,
        uId: `${req.currentUser?.uId}`,
        username: `${req.currentUser?.username}`
      },
      createdAt: commentData.createdAt
    });
    // save comment in cache
    await commentCache.addCommentCache(commentData);
    // save comment in db
    commentQueue.addCommentJob('addCommentInDBQueue', commentData);

    res.status(200).json({ message: 'Comment added successfully.' });
  }
}
