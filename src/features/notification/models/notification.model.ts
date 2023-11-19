import { INotification, INotificationDocument } from '@notification/interfaces/notificaton.interface';
import mongoose, { model, Model, Schema } from 'mongoose';

const notificationSchema: Schema = new Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', index: true },
  docCreator: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' },
  read: { type: Boolean, default: false },
  message: { type: String, default: '' },
  communityName: { type: String, default: '' },
  notificationType: { type: String, enum: ['like', 'love', 'happy', 'wow', 'sad', 'angry', 'comment', 'community', 'follow'] },
  entityId: mongoose.Types.ObjectId,
  createdItemId: mongoose.Types.ObjectId,

  createdAt: { type: Date, default: Date.now() }
});

notificationSchema.methods.insertNotification = async function (body: INotification) {
  try {
    await NotificationModel.create({
      creator: body.creator.authId,
      docCreator: body.docCreator,
      message: body.message,
      communityName: body.communityName,
      notificationType: body.notificationType,
      entityId: body.entityId,
      createdItemId: body.createdItemId
    });

    // const notifications: INotificationDocument[] = await notificationService.getNotifications(`${body.docCreator}`);
    // return notifications;
  } catch (error) {
    return error;
  }
};

const NotificationModel: Model<INotificationDocument> = model<INotificationDocument>('Notification', notificationSchema, 'Notification');
export { NotificationModel };
