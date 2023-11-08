import { DoneCallback, Job } from 'bull';
import { authService } from '@services/db/auth.services';

class AuthWorker {
  async addAuthWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { value } = job.data;
      // save data in db
      await authService.createAuthUser(value);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const authWorker: AuthWorker = new AuthWorker();
