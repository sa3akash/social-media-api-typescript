import { DoneCallback, Job } from 'bull';
import { userService } from '@services/db/user.services';

class UserWorker {
  async addUserWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { value } = job.data;
      // save data in db
      await userService.addUserDataInDB(value);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const userWorker: UserWorker = new UserWorker();
