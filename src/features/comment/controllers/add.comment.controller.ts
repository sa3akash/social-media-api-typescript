import { AuthModel } from '@auth/models/auth.db.model';
import { CommentModel } from '@comment/models/comment.model';
import { addCommentSchema } from '@comment/schemas/comment.schema.joi';
import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { PostModel } from '@post/models/post.models';
import { notificationQueue } from '@services/queues/notification.queue';
import { Request, Response } from 'express';
import { ObjectId } from 'mongoose';

export class AddCommentController {
  @joiValidation(addCommentSchema)
  public async addComment(req: Request, res: Response): Promise<void> {
    const { content, postId, replyToUser } = req.body;
    let parentId = req.body.parentId;
    const author = req.currentUser?.id; // Assuming auth middleware

    const post = await PostModel.findById(postId);
    if (!post) throw new BadRequestError('Post not found');

    let path: ObjectId[] = [];
    let depth = 0;

    if (parentId) {
      const parentComment = await CommentModel.findById(parentId);
      if (!parentComment) throw new BadRequestError('Parent comment not found');

      if (parentComment.depth >= 3) {
        parentId = parentComment.parentId;
        depth = parentComment.depth;
        path = [...parentComment.path];
      } else {
        path = [...parentComment.path, parentComment._id];
        depth = parentComment.depth + 1;
      }
    }

    let replyUser;

    if (replyToUser) {
      replyUser = await AuthModel.findById(replyToUser);
      if (!replyUser) throw new BadRequestError('User does not exist');

      const getCheckComment = await CommentModel.findOne({ postId, author: replyToUser });
      if (!getCheckComment) throw new BadRequestError('Comment does not exist');
    }

    const newComment = new CommentModel({ content, author, postId, parentId, replyToUser, path, depth });
    await newComment.save();

    notificationQueue.commentNotification('commentNotification', newComment._id);

    res.status(201).json({
      ...newComment.toJSON(),
      author: req.currentUser,
      replyToUser: replyUser
    });
  }

  public async deleteComment(req: Request, res: Response) {
    const { commentId } = req.params;
    if (!commentId) throw new BadRequestError('Comment ID is required');

    notificationQueue.commentNotification('commentDelete', commentId);

    res.status(200).json({ message: 'Comment deleted successfully.' });
  }

  public async updateComment(req: Request, res: Response) {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!commentId || !content) throw new BadRequestError('All are is required');

    const comment = await CommentModel.findByIdAndUpdate(commentId, { $set: { content } }, { new: true });

    res.status(200).json(comment);
  }
}
