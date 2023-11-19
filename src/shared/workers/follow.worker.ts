import { FullUserDoc } from '@auth/interfaces/auth.interface';
import { INotification } from '@notification/interfaces/notificaton.interface';
import { NotificationModel } from '@notification/models/notification.model';
import { userCache } from '@services/cache/user.cache';
import { followerService } from '@services/db/follower.services';
import { notificationTemplate } from '@services/emails/template/notifications/notification.template';
import { emailQueue } from '@services/queues/email-queue';
import { socketIoNotificationObject } from '@sockets/notification.socket';
import { DoneCallback, Job } from 'bull';

class FollowWorker {
  async addFollowWorker(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { keyOne, keyTwo } = job.data;
      // save data in db
      const followDoc = await followerService.addFollow(keyOne, keyTwo);
      // add method to save data in db

      const followerData: FullUserDoc = await userCache.getUserByIdFromCache(`${keyTwo}`);
      if (followerData.notifications.follows && keyOne !== keyTwo) {
        const authData: FullUserDoc = await userCache.getUserByIdFromCache(`${keyOne}`);
        // notifications
        const notificationData: INotification = {
          creator: {
            authId: followerData.authId,
            name: followerData.name,
            avatarColor: followerData.avatarColor,
            coverPicture: followerData.coverPicture,
            email: followerData.email,
            profilePicture: followerData.profilePicture,
            uId: followerData.uId,
            username: followerData.username
          },
          docCreator: `${keyOne}`,
          message: `${authData.name.first} is now following you.`,
          notificationType: 'follow',
          entityId: authData.authId,
          createdItemId: `${followDoc._id}`
        } as INotification;

        // send to socketio
        socketIoNotificationObject.emit('follow-notification', notificationData, { userTo: notificationData.docCreator });
        // send to email queue
        const template: string = notificationTemplate.notificationMessageTemplate({
          username: followerData.name.first,
          message: `${authData.name.first} is follow your account.`,
          header: 'Follow Notification'
        });

        emailQueue.addEmailJob('followEmail', {
          template: template,
          receiverEmail: `${followerData.email}`,
          subject: 'Follow Notification'
        });

        // save in db
        const notificationModel = new NotificationModel();
        await notificationModel.insertNotification(notificationData);
      }

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
