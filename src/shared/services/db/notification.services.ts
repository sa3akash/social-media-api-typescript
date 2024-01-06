import { INotificationDocument } from '@notification/interfaces/notificaton.interface';
import { NotificationModel } from '@notification/models/notification.model';
import mongoose from 'mongoose';

class NotificationService {
  public async getNotifications(docCreator: string, skip: number, limit: number): Promise<INotificationDocument[]> {
    const authId = new mongoose.Types.ObjectId(docCreator);

    const notifications: INotificationDocument[] = await NotificationModel.aggregate([
      { $match: { docCreator: authId, creator: { $ne: authId } } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'Auth', localField: 'creator', foreignField: '_id', as: 'authIdFromData' } },
      { $unwind: '$authIdFromData' },
      {
        $project: {
          _id: 1,
          message: 1,
          createdAt: 1,
          createdItemId: 1,
          entityId: 1,
          notificationType: 1,
          communityName: 1,
          read: 1,
          docCreator: 1,
          creator: {
            authId: '$authIdFromData._id',
            profilePicture: '$authIdFromData.profilePicture',
            coverPicture: '$authIdFromData.coverPicture',
            email: '$authIdFromData.email',
            username: '$authIdFromData.username',
            avatarColor: '$authIdFromData.avatarColor',
            uId: '$authIdFromData.uId',
            name: '$authIdFromData.name'
          }
        }
      }
    ]);
    return notifications;
  }

  public async updateNotification(notificationId: string): Promise<void> {
    await NotificationModel.updateOne({ _id: notificationId }, { $set: { read: true } }).exec();
  }

  public async deleteNotification(notificationId: string): Promise<void> {
    await NotificationModel.findByIdAndDelete(notificationId);
  }

  public async numberOfNotification(docCreator: string): Promise<number> {
    return await NotificationModel.find({ docCreator: docCreator, creator: { $ne: docCreator } }).countDocuments();
  }
}

export const notificationService: NotificationService = new NotificationService();
