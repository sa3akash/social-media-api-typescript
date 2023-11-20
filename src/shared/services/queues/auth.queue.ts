import { IAuthJob, IProfileImageChange } from '@auth/interfaces/auth.interface';
import { BaseQueue } from '@services/queues/base.queue';
import { authWorker } from '@workers/auth.worker';

class AuthQueue extends BaseQueue {
  constructor() {
    super('authQueue');
    this.processJob('addAuthDataInDB', 5, authWorker.addAuthWorker);
    this.processJob('updateProfilePicDB', 5, authWorker.updateProfileAuthWorker);
    this.processJob('updateCoverPicInDB', 5, authWorker.updateCoverAuthWorker);
    this.processJob('updateUsernameInDB', 5, authWorker.updateUsernameAuthWorker);
  }

  public addAuthUserJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }

  public updateProfileImageJob(name: string, data: IProfileImageChange): void {
    this.addJob(name, data);
  }
  public updateUsernameJob(name: string, data: IProfileImageChange): void {
    this.addJob(name, data);
  }
}

export const authQueue: AuthQueue = new AuthQueue();
