import { INotificationJobData } from '@notification/interfaces/notificaton.interface';
import { BaseQueue } from '@services/queues/base.queue';
import { notificationWorker } from '@workers/notification.worker';

class NotificationQueue extends BaseQueue {
  constructor() {
    super('notificationQueue');
    this.processJob('updateNotification', 5, notificationWorker.updateNotificationDB);
    this.processJob('deleteNotification', 5, notificationWorker.deleteNotificationDB);
    this.processJob('commentNotification', 5, notificationWorker.commentNotification);
    this.processJob('commentDelete', 5, notificationWorker.deleteComment);
  }

  public updateNotificationJob(name: string, data: INotificationJobData): void {
    this.addJob(name, data);
  }

  public removeNotificationJob(name: string, data: INotificationJobData): void {
    this.addJob(name, data);
  }
  public commentNotification(name: string, data: string): void {
    this.addJob(name, data);
  }
}

export const notificationQueue: NotificationQueue = new NotificationQueue();
