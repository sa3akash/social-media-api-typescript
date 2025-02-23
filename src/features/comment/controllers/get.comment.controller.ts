import { CommentModel } from '@comment/models/comment.model';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { Request, Response } from 'express';

export class GetCommentController {
  public async getAllComments(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const { lastCreatedAt, limit } = req.query;

    if (!postId) throw new BadRequestError('Post ID is required');

    const comments = await CommentModel.getCommentsWithReplyCount(
      postId,
      lastCreatedAt ? new Date(lastCreatedAt as string) : null,
      Number(limit) || 10
    );
    res.status(200).json(comments);
  }

  public async getReplies(req: Request, res: Response): Promise<void> {
    const { commentId } = req.params;
    const { lastCreatedAt, limit } = req.query;

    if (!commentId) throw new BadRequestError('Comment ID is required');

    const replies = await CommentModel.getRepliesWithReplyCount(
      commentId,
      lastCreatedAt ? new Date(lastCreatedAt as string) : null,
      Number(limit) || 10
    );
    res.status(200).json(replies);
  }
}
