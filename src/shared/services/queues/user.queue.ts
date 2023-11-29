import { IAuthJob, IUpdateUser } from '@auth/interfaces/auth.interface';
import { BaseQueue } from '@services/queues/base.queue';
import { userWorker } from '@workers/user.worker';

class UserQueue extends BaseQueue {
  constructor() {
    super('userQueue');
    this.processJob('addUserDataInDB', 5, userWorker.addUserWorker);
    this.processJob('updateBasicInfoInDB', 5, userWorker.updateUserWorker);
    this.processJob('updateNotificationSettings', 5, userWorker.updateUserWorker);
  }

  public addUserDataJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }
  public updateUserDataJob(name: string, data: IUpdateUser): void {
    this.addJob(name, data);
  }
}

export const userQueue: UserQueue = new UserQueue();
