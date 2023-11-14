import { IPostDocument } from '@post/interfaces/post.interfaces';
import { IReactionDocument, IReactionJob, IReactions } from '@reaction/interfaces/reaction.interface';
import { postServices } from '@services/db/post.services';
import { reactionService } from '@services/db/reaction.services';
import { DoneCallback, Job } from 'bull';

class ReactionWorker {
  async addReactionWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // save data in db
      const reactionDocument: IReactionDocument = job.data;

      const postUpdate: IPostDocument = await postServices.getSinglePostById(reactionDocument.postId);
      if (postUpdate.reactions) {
        postUpdate.reactions[reactionDocument.type as keyof IReactions] += 1;
      }
      await postServices.updatePostById(postUpdate);
      await reactionService.addReaction(reactionDocument);
      // send notification
      // work lettre
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
  async updateReactionWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // save data in db
      const { previousReaction, type }: IReactionJob = job.data;

      const postUpdate: IPostDocument = await postServices.getSinglePostById(previousReaction.postId);

      if (previousReaction.type === type) {
        // remove
        if (postUpdate.reactions) {
          postUpdate.reactions[previousReaction.type as keyof IReactions] -= 1;
          await reactionService.deleteReactionById(`${previousReaction._id}`);
        }
      } else {
        // update
        if (postUpdate.reactions) {
          postUpdate.reactions[previousReaction.type as keyof IReactions] -= 1;
          postUpdate.reactions[type as keyof IReactions] += 1;
          await reactionService.updateReactionById(`${previousReaction._id}`, type);
        }
      }

      await postServices.updatePostById(postUpdate);

      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const reactionWorker: ReactionWorker = new ReactionWorker();
