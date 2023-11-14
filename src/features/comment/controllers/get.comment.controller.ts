import { ICommentDocument } from '@comment/interfaces/comment.interface';
import { commentCache } from '@services/cache/comment.cache';
import { commentService } from '@services/db/comment.services';
import { Request, Response } from 'express';

const PAGE_SIZE = 10;

export class GetCommentController {
  public async getAllComments(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const newSkip: number = skip === 0 ? skip : skip + 1;
    // comment in cache
    const commentsFromCache: ICommentDocument[] = await commentCache.getAllCommentsCache(`${postId}`, newSkip, limit);
    // get comment count in cahce
    const commentsCountCache: number = await commentCache.getAllCommentsCountCache(`${postId}`);

    const allComments: ICommentDocument[] = commentsFromCache.length
      ? commentsFromCache
      : await commentService.getCommentsDB(`${postId}`, skip, limit);

    const numberOfCommentPages: number = commentsCountCache ? commentsCountCache : await commentService.getCommentsCountDB(`${postId}`);

    res.status(200).json({
      message: 'Comment added successfully.',
      comments: allComments,
      numberOfPages: Math.ceil(numberOfCommentPages / limit)
    });
  }
}
