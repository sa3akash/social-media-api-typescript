import { NameDoc } from '@auth/interfaces/auth.interface';
import { ICommentDocument } from '@comment/interfaces/comment.interface';
import { addCommentSchema } from '@comment/schemas/comment.schema.joi';
import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { commentCache } from '@services/cache/comment.cache';
import { commentQueue } from '@services/queues/comment.queue';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

export class AddCommentController {
  @joiValidation(addCommentSchema)
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

    // save comment in cache
    await commentCache.addCommentCache(commentData);
    // save comment in db
    commentQueue.addCommentJob('addCommentInDBQueue', {
      value: commentData,
      creator: {
        authId: `${req.currentUser?.id}`,
        profilePicture: `${req.currentUser?.profilePicture}`,
        coverPicture: `${req.currentUser?.coverPicture}`,
        email: `${req.currentUser?.email}`,
        username: `${req.currentUser?.username}`,
        avatarColor: `${req.currentUser?.avatarColor}`,
        uId: `${req.currentUser?.uId}`,
        name: req.currentUser?.name as NameDoc,
        createdAt: `${req.currentUser?.createdAt}`
      }
    });

    res.status(200).json({ message: 'Comment added successfully.' });
  }
}
