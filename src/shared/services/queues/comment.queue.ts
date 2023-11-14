import { ICommentDocument } from '@comment/interfaces/comment.interface';
import { BaseQueue } from '@services/queues/base.queue';
import { commentWorker } from '@workers/comment.worker';

class CommentQueue extends BaseQueue {
  constructor() {
    super('commentQueue');
    this.processJob('addCommentInDBQueue', 5, commentWorker.addCommentInWorker);
  }

  public addCommentJob(name: string, data: ICommentDocument): void {
    this.addJob(name, data);
  }

  //   public deleteCommentJob(name: string, data: IReactionJob): void {
  //     this.addJob(name, data);
  //   }
}

export const commentQueue: CommentQueue = new CommentQueue();
