import { deleteFile } from '@globals/helpers/cloudinaryUpload';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { postServices } from '@services/db/post.services';
import { DoneCallback, Job } from 'bull';

class PostWorker {
  async addPostWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // save data in db
      await postServices.addPostInDB(job.data);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async deletePostWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // save data in db
      const { postId, authId } = job.data;

      const post: IPostDocument = await postServices.getPostById(postId);

      if (post.files.length > 0) {
        post.files.forEach(async (file) => {
          await deleteFile(file.filename);
        });
      }

      await postServices.deletePost(postId, authId);

      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async updatePostWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // // save data in db
      // const {  } = job.data;

      await postServices.updatePostById(job.data);

      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const postWorker: PostWorker = new PostWorker();
