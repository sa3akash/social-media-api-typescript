import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { IReactionDocument } from '@reaction/interfaces/reaction.interface';
import { addReactionSchema } from '@reaction/schemas/reaction.schema';
import { reactionCache } from '@services/cache/reaction.cache';
import { reactionService } from '@services/db/reaction.services';
import { reactionQueue } from '@services/queues/reaction.queue';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

export class AddReactionController {
  @joiValidation(addReactionSchema)
  public async add(req: Request, res: Response): Promise<void> {
    const { type, postId } = req.body;

    const previousReactionCache = await reactionCache.getPreviousReactions(postId, `${req.currentUser?.id}`);

    const previousReaction = previousReactionCache
      ? previousReactionCache
      : await reactionService.getReactionByPostIdAndAuthId(postId, `${req.currentUser?.id}`);

    if (!previousReaction) {
      const reactionObject: IReactionDocument = {
        _id: new ObjectId(),
        authId: `${req.currentUser?.id}`,
        postId: postId,
        type: type,
        createdAt: new Date()
      } as IReactionDocument;

      // socketIoPostObject.emit('add-reaction', {
      //   _id: reactionObject._id,
      //   docCreator: `${req.currentUser?.id}`,
      //   read: false,
      //   creator: {
      //     authId: `${req.currentUser?.id}`,
      //     avatarColor: `${req.currentUser?.avatarColor}`,
      //     coverPicture: `${req.currentUser?.coverPicture}`,
      //     email: `${req.currentUser?.email}`,
      //     name: req.currentUser?.name,
      //     profilePicture: `${req.currentUser?.profilePicture}`,
      //     uId: `${req.currentUser?.uId}`,
      //     username: `${req.currentUser?.username}`
      //   },
      //   postId: reactionObject.postId,
      //   type: reactionObject.type,
      //   createdAt: reactionObject.createdAt
      // });

      await reactionCache.addReactionInCache(reactionObject);
      reactionQueue.addReactionJob('addReactionInDBQueue', reactionObject);
    } else {
      // update
      await reactionCache.updateReactionFromCache(previousReaction, type);
      reactionQueue.updateReactionJob('updateReactionInDBQueue', {
        previousReaction,
        type
      });
    }

    res.status(HTTP_STATUS.OK).json({ message: 'Reaction updated successfully.' });
  }
}