import { DoneCallback, Job } from 'bull';
import { notificationService } from '@services/db/notification.services';

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
}

export const notificationWorker: NotificationWorker = new NotificationWorker();
