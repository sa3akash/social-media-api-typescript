import { IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { BaseQueue } from '@services/queues/base.queue';
import { reactionWorker } from '@workers/reaction.worker';

class ReactionQueue extends BaseQueue {
  constructor() {
    super('reactionQueue');
    this.processJob('addReactionInDBQueue', 5, reactionWorker.addReactionWorker);
    this.processJob('updateReactionInDBQueue', 5, reactionWorker.updateReactionWorker);
  }

  public addReactionJob(name: string, data: IReactionDocument): void {
    this.addJob(name, data);
  }
  public updateReactionJob(name: string, data: IReactionJob): void {
    this.addJob(name, data);
  }
}

export const reactionQueue: ReactionQueue = new ReactionQueue();
