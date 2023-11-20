import { DoneCallback, Job } from 'bull';
import { authService } from '@services/db/auth.services';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { deleteFile, getPublicId } from '@globals/helpers/cloudinaryUpload';

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
  async updateProfileAuthWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { authId, imageUrl } = job.data;
      // save data in db

      const authData: IAuthDocument = await authService.getAuthUserByAuthId(authId);

      if (authData.profilePicture.length) {
        await deleteFile(getPublicId(authData.profilePicture));
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
        await deleteFile(getPublicId(authData.profilePicture));
      }

      await authService.updateCoverPicture(authId, imageUrl);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const authWorker: AuthWorker = new AuthWorker();
