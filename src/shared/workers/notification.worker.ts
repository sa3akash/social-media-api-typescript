import { DoneCallback, Job } from 'bull';
import { notificationService } from '@services/db/notification.services';
import { CommentModel } from '@comment/models/comment.model';
import { PostModel } from '@post/models/post.models';
import { socketIoPostObject } from '@sockets/post.sockets';
import { postCache } from '@services/cache/post.cache';
import { INotification } from '@notification/interfaces/notificaton.interface';
import { socketIoNotificationObject } from '@sockets/notification.socket';
import { AuthModel } from '@auth/models/auth.db.model';
import { notificationTemplate } from '@services/emails/template/notifications/notification.template';
import { NameDoc } from '@auth/interfaces/auth.interface';
import { emailQueue } from '@services/queues/email-queue';
import { NotificationModel } from '@notification/models/notification.model';

class NotificationWorker {
  async updateNotificationDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key } = job.data;
      // save data in db
      await notificationService.updateNotification(key);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
  async deleteNotificationDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key } = job.data;
      // save data in db
      await notificationService.deleteNotification(key);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async commentNotification(job: Job, done: DoneCallback) {
    try {
      const commentId = job.data;

      const commentDoc = await CommentModel.findById(commentId);

      const post = await PostModel.findById(commentDoc?.postId);
      if (post) {
        
        await postCache.updatePostFromCache({
          ...post.toJSON(),
          commentsCount: post.commentsCount + 1
        });

        await post.updateOne({ $inc: { commentsCount: 1 } });

        const postData = await postCache.getPostByIdFromCache(`${post._id}`);

        socketIoPostObject.emit('update-comment', postData, commentDoc?.author);

        if (commentDoc && post.authId !== commentDoc?.author) {
          const authData = await AuthModel.findById(commentDoc?.author);

          const notificationData: INotification = {
            creator: {
              authId: authData?._id as string,
              avatarColor: authData?.avatarColor as string,
              coverPicture: authData?.coverPicture as string,
              email: authData?.email as string,
              name: authData?.name as NameDoc,
              profilePicture: authData?.profilePicture as string,
              uId: authData?.uId as string,
              username: authData?.username as string
            },
            docCreator: `${post.creator?.authId}`,
            message: `${commentDoc?.content}`,
            notificationType: 'comment',
            entityId: `${commentDoc?.postId}`,
            createdItemId: `${commentDoc?._id}`,
            createdAt: `${commentDoc.createdAt}`
          };
          // send to socketio
          socketIoNotificationObject.emit('insert-notification', notificationData, { userTo: post.authId });

          // send to email queue
          const template: string = notificationTemplate.notificationMessageTemplate({
            username: postData?.creator?.name.first as string,
            message: `${notificationData.creator.name.first} is comment your post.`,
            header: 'Comment Notification'
          });

          emailQueue.addEmailJob('commentEmail', {
            template: template,
            receiverEmail: `${postData?.creator?.email}`,
            subject: 'Post Notification'
          });

          // save in db
          const notificationModel = new NotificationModel();
          await notificationModel.insertNotification(notificationData);
        }
      }

      // save data in db

      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async deleteComment(job: Job, done: DoneCallback): Promise<void> {
    try {
      const commentId = job.data;

      // save data in db
      const comment = await CommentModel.findById(commentId);
      const post = await PostModel.findByIdAndUpdate({ _id: comment?.postId }, { $inc: { commentsCount: -1 } },{new:true});

      if (post && comment) {
        await postCache.updatePostFromCache({
          ...post?.toJSON()
        });
        
        const postData = await postCache.getPostByIdFromCache(`${comment?.postId}`);
        
        socketIoPostObject.emit('updated-post', postData, comment?.author);
        await comment?.deleteOne();
      }

      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const notificationWorker: NotificationWorker = new NotificationWorker();
