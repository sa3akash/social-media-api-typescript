import { followerService } from '@services/db/follower.services';
import { DoneCallback, Job } from 'bull';

class FollowWorker {
  async addFollowWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { keyOne, keyTwo } = job.data;
      // save data in db
      await followerService.addFollow(keyOne, keyTwo);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
  async removeFollowWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { keyOne, keyTwo } = job.data;
      // save data in db
      await followerService.removeFollow(keyOne, keyTwo);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async blockUserWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // keyOne = authId and keyTwo = followerId and type=block or unblock
      const { keyOne, keyTwo, type } = job.data;
      if (type === 'block') {
        await followerService.blockUser(keyOne, keyTwo);
      } else {
        await followerService.unBlockUser(keyOne, keyTwo);
      }
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const followWorker: FollowWorker = new FollowWorker();
