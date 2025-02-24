import { DoneCallback, Job } from 'bull';
import { authService } from '@services/db/auth.services';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { GoLive } from '@root/features/goLive/models/GoLive';
import { fileUtils } from '@globals/helpers/fileUtils';

class AuthWorker {
  async addAuthWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { value } = job.data;
      // save data in db
      await authService.createAuthUser(value);
      // add method to save data in db
      await GoLive.create({
        authId: value._id,
        privacy: 'Public'
      });
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
  async updateProfileAuthWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { authId, imageUrl } = job.data;
      // save data in db

      const authData: IAuthDocument = await authService.getAuthUserByAuthId(authId);

      if (authData.profilePicture.length) {
        fileUtils.deleteFile(authData.profilePicture);
      }

      await authService.updateProfilePicture(authId, imageUrl);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
  async updateCoverAuthWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { authId, imageUrl } = job.data;
      // save data in db
      const authData: IAuthDocument = await authService.getAuthUserByAuthId(authId);

      if (authData.coverPicture.length) {
        fileUtils.deleteFile(authData.coverPicture);
      }

      await authService.updateCoverPicture(authId, imageUrl);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async updateUsernameAuthWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { authId, username } = job.data;

      await authService.updateUsernamePicture(authId, username);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const authWorker: AuthWorker = new AuthWorker();
