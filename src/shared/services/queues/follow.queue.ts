import { IBlockedUserJobData, IFollowerJobData } from '@follower/interfaces/follower.interface';
import { BaseQueue } from '@services/queues/base.queue';
import { followWorker } from '@workers/follow.worker';

class FollowQueue extends BaseQueue {
  constructor() {
    super('followQueue');
    this.processJob('addFollowSaveInDB', 5, followWorker.addFollowWorker);
    this.processJob('removeFollowSaveInDB', 5, followWorker.removeFollowWorker);
    this.processJob('blockUserInDB', 5, followWorker.blockUserWorker);
  }

  public addFollowJob(name: string, data: IFollowerJobData): void {
    this.addJob(name, data);
  }

  public removeFollowJob(name: string, data: IFollowerJobData): void {
    this.addJob(name, data);
  }

  public blockUserJob(name: string, data: IBlockedUserJobData): void {
    this.addJob(name, data);
  }
}

export const followQueue: FollowQueue = new FollowQueue();
