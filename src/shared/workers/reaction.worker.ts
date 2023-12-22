import { FullUserDoc } from '@auth/interfaces/auth.interface';
import { INotification } from '@notification/interfaces/notificaton.interface';
import { NotificationModel } from '@notification/models/notification.model';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { IReactionDocument, IReactionJob, IReactions } from '@reaction/interfaces/reaction.interface';
import { userCache } from '@services/cache/user.cache';
import { postServices } from '@services/db/post.services';
import { reactionService } from '@services/db/reaction.services';
import { notificationTemplate } from '@services/emails/template/notifications/notification.template';
import { emailQueue } from '@services/queues/email-queue';
import { socketIoNotificationObject } from '@sockets/notification.socket';
import { DoneCallback, Job } from 'bull';

class ReactionWorker {
  async addReactionWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // save data in db
      const reactionDocument: IReactionDocument = job.data;

      const postUpdate: IPostDocument = await postServices.getSinglePostById(reactionDocument.postId);
      if (postUpdate.reactions) {
        postUpdate.reactions[reactionDocument.type as keyof IReactions] += 1;
      }
      await postServices.updatePostById(postUpdate);
      await reactionService.addReaction(reactionDocument);
      // send notification
      // work lettre

      const followerData: FullUserDoc = await userCache.getUserByIdFromCache(`${postUpdate.creator?.authId}`);
      if (followerData.notifications.reactions && postUpdate.creator?.authId !== reactionDocument.authId) {
        const authData: FullUserDoc = await userCache.getUserByIdFromCache(`${reactionDocument.authId}`);
        // notifications
        const notificationData: INotification = {
          creator: {
            authId: authData.authId,
            name: authData.name,
            avatarColor: authData.avatarColor,
            coverPicture: authData.coverPicture,
            email: authData.email,
            profilePicture: authData.profilePicture,
            uId: authData.uId,
            username: authData.username
          },
          docCreator: `${followerData.authId}`,
          message: postUpdate.post,
          notificationType: reactionDocument.type,
          entityId: postUpdate._id,
          createdItemId: `${authData._id}`,
          createdAt: `${new Date()}`
        } as unknown as INotification;

        // send to socketio
        socketIoNotificationObject.emit('reaction-notification', notificationData, { userTo: notificationData.docCreator });
        // send to email queue
        const template: string = notificationTemplate.notificationMessageTemplate({
          username: followerData.name.first,
          message: notificationData.message,
          header: `${reactionDocument.type} your post.`
        });

        emailQueue.addEmailJob('reactionEmail', {
          template: template,
          receiverEmail: `${followerData.email}`,
          subject: 'Reaction Notification'
        });

        // save in db
        const notificationModel = new NotificationModel();
        await notificationModel.insertNotification(notificationData);
      }

      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
  async updateReactionWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      // save data in db
      const { previousReaction, type }: IReactionJob = job.data;

      const postUpdate: IPostDocument = await postServices.getSinglePostById(previousReaction.postId);

      if (previousReaction.type === type) {
        // remove
        if (postUpdate.reactions) {
          postUpdate.reactions[previousReaction.type as keyof IReactions] -= 1;
          await reactionService.deleteReactionById(`${previousReaction._id}`);
        }
      } else {
        // update
        if (postUpdate.reactions) {
          postUpdate.reactions[previousReaction.type as keyof IReactions] -= 1;
          postUpdate.reactions[type as keyof IReactions] += 1;
          await reactionService.updateReactionById(`${previousReaction._id}`, type);
        }
      }

      await postServices.updatePostById(postUpdate);

      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const reactionWorker: ReactionWorker = new ReactionWorker();
