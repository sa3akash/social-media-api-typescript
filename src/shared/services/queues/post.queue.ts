import { IPostDocument, IPostJobData } from '@post/interfaces/post.interfaces';
import { BaseQueue } from '@services/queues/base.queue';
import { postWorker } from '@workers/post.worker';

class PostQueue extends BaseQueue {
  constructor() {
    super('postQueue');
    this.processJob('addPostInDBQueue', 5, postWorker.addPostWorker);
    this.processJob('deletePostInDBQueue', 5, postWorker.deletePostWorker);
    this.processJob('updatePostInDBQueue', 5, postWorker.updatePostWorker);
  }

  public addPostJob(name: string, data: IPostDocument): void {
    this.addJob(name, data);
  }
  public deletePostJob(name: string, data: IPostJobData): void {
    this.addJob(name, data);
  }
  public updatePostJob(name: string, data: IPostJobData): void {
    this.addJob(name, data);
  }
}

export const postQueue: PostQueue = new PostQueue();
