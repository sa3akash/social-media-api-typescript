import { FullUserDoc } from '@auth/interfaces/auth.interface';
import { ICommentJob } from '@comment/interfaces/comment.interface';
import { INotification } from '@notification/interfaces/notificaton.interface';
import { NotificationModel } from '@notification/models/notification.model';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { userCache } from '@services/cache/user.cache';
import { commentService } from '@services/db/comment.services';
import { postServices } from '@services/db/post.services';
import { notificationTemplate } from '@services/emails/template/notifications/notification.template';
import { emailQueue } from '@services/queues/email-queue';
import { socketIoNotificationObject } from '@sockets/notification.socket';
import { socketIoPostObject } from '@sockets/post.sockets';
import { DoneCallback, Job } from 'bull';

class CommentWorker {
  async addCommentInWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // save data in db
      const commentDocument: ICommentJob = job.data;
      // save db
      const singlePost: IPostDocument = await postServices.getSinglePostById(commentDocument.value.postId);
      singlePost.commentsCount += 1;

      socketIoPostObject.emit('update-comment', singlePost);

      await postServices.updatePostById(singlePost);
      const createdComment = await commentService.addCommentDB(commentDocument.value);
      // send notification
      const postCreator: FullUserDoc = await userCache.getUserByIdFromCache(`${singlePost.creator?.authId}`);

      if (postCreator.notifications && postCreator.authId !== commentDocument.creator.authId) {
        const notificationData: INotification = {
          creator: commentDocument.creator,
          docCreator: `${singlePost.creator?.authId}`,
          message: `${commentDocument.value.comment}`,
          notificationType: 'comment',
          entityId: commentDocument.value.postId,
          createdItemId: `${createdComment._id}`,
          createdAt: `${new Date()}`
        } as INotification;

        // send to socketio
        socketIoNotificationObject.emit('insert-notification', notificationData, { userTo: notificationData.docCreator });

        // send to email queue
        const template: string = notificationTemplate.notificationMessageTemplate({
          username: postCreator.name.first,
          message: `${notificationData.creator.name.first} is comment your post.`,
          header: 'Comment Notification'
        });

        emailQueue.addEmailJob('commentEmail', {
          template: template,
          receiverEmail: `${singlePost.creator?.email}`,
          subject: 'Post Notification'
        });

        // save in db
        const notificationModel = new NotificationModel();
        await notificationModel.insertNotification(notificationData);
      }

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
