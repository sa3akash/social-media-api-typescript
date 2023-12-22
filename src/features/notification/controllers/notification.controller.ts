import { INotificationDocument } from '@notification/interfaces/notificaton.interface';
import { notificationService } from '@services/db/notification.services';
import { notificationQueue } from '@services/queues/notification.queue';
import { socketIoNotificationObject } from '@sockets/notification.socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const PAGE_SIZE = 10;

export class NotificationController {
  public updateNotification(req: Request, res: Response) {
    const { notificationId } = req.params;

    socketIoNotificationObject.emit('update-notification', notificationId);

    // notifications queue
    notificationQueue.updateNotificationJob('updateNotification', { key: notificationId });

    res.status(HTTP_STATUS.OK).json({ message: 'notification marked as read.' });
  }

  public deleteNotification(req: Request, res: Response) {
    const { notificationId } = req.params;

    socketIoNotificationObject.emit('delete-notification', notificationId);

    // notifications queue
    notificationQueue.updateNotificationJob('deleteNotification', { key: notificationId });

    res.status(HTTP_STATUS.OK).json({ message: 'notification deleted.' });
  }

  public async getNotification(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    // notifications queue
    const notifications: INotificationDocument[] = await notificationService.getNotifications(`${req.currentUser?.id}`, skip, limit);

    const numberOfNotification: number = await notificationService.numberOfNotification(`${req.currentUser?.id}`);
    // response
    res.status(HTTP_STATUS.OK).json({
      message: 'Get all posts notifications.',
      notifications: notifications,
      currentPage: Number(page),
      numberOfPages: Math.ceil(numberOfNotification / limit)
    });
  }
}
