import { ICommentDocument } from '@comment/interfaces/comment.interface';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { commentService } from '@services/db/comment.services';
import { postServices } from '@services/db/post.services';
import { DoneCallback, Job } from 'bull';

class CommentWorker {
  async addCommentInWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // save data in db
      const commentDocument: ICommentDocument = job.data;
      // save db
      const singlePost: IPostDocument = await postServices.getSinglePostById(commentDocument.postId);
      singlePost.commentsCount += 1;
      await postServices.updatePostById(singlePost);
      await commentService.addCommentDB(commentDocument);
      // send notification
      // work lettre
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const commentWorker: CommentWorker = new CommentWorker();
