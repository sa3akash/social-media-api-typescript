import { reactionCache } from '@services/cache/reaction.cache';
import { reactionService } from '@services/db/reaction.services';
import { Request, Response } from 'express';

const PAGE_SIZE = 10;

export class GetReactionController {
  async getAll(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const newSkip: number = skip === 0 ? skip : skip + 1;

    const postId = req.params.postId as string;
    const allReactionCache = await reactionCache.getAllReactionsCache(`${postId}`, newSkip, limit);

    const getAllReaction = allReactionCache ? allReactionCache : await reactionService.getReactionsByPostId(`${postId}`, skip, limit);

    res.json({
      reactions: getAllReaction.reactions,
      currentPage: Number(page),
      numberOfPages: Math.ceil(getAllReaction.reactionsCount || 0 / limit),
      message: 'Get all reactions based on postId.'
    });
  }
  async getByType(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const postId = req.params.postId as string;
    const type = req.query.type as string;

    const getTypeReactionCache = await reactionCache.getReactionsByPostIdAndTypeCache(postId, type, skip, limit);

    const getAllReactionCache = getTypeReactionCache.reactions?.length
      ? getTypeReactionCache
      : await reactionService.getReactionsByPostIdWithType(postId, type, skip, limit);

    res.json({
      reactions: getAllReactionCache.reactions,
      currentPage: Number(page),
      numberOfPages: Math.ceil(getAllReactionCache.reactionsCount / limit),
      message: `Get all ${type} reactions.`
    });
  }
  async getAllReactionSpacifcUser(req: Request, res: Response): Promise<void> {
    const getAllReactionCache = await reactionService.getAllReactionSpacificUser(`${req.currentUser?.id}`);

    res.json({
      reactions: getAllReactionCache,
      message: 'All reactions in this user.'
    });
  }

  async getSingleReactionByAuthId(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const singleReactionAuthIdCache = await reactionCache.getReactionsByAuthIdAndPostIdCache(`${postId}`, `${req.currentUser?.id}`);
    const getAllReactionCache = singleReactionAuthIdCache
      ? singleReactionAuthIdCache
      : await reactionService.getSingleReactionsByAuthId(`${postId}`, `${req.currentUser?.id}`);

    res.json({
      reaction: getAllReactionCache,
      message: 'Get single reaction by authId.'
    });
  }
}
