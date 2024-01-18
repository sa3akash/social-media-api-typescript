import { deleteFile } from '@globals/helpers/cloudinaryUpload';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { commentService } from '@services/db/comment.services';
import { postServices } from '@services/db/post.services';
import { reactionService } from '@services/db/reaction.services';
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
      await reactionService.allDeleteReactionById(postId);
      await commentService.allDeleteCommentsByPostId(postId);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async updatePostWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const getPostById: IPostDocument = await postServices.getSinglePostById(`${job.data._id}`);

      if (getPostById.files.length > 0) {
        getPostById.files.forEach(async (file) => {
          console.log(file);
          await deleteFile(file.filename);
        });
      }

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
