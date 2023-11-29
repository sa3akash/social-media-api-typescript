import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { userCache } from '@services/cache/user.cache';
import { userQueue } from '@services/queues/user.queue';
import { notificationSettingsSchema } from '@user/schemas/info';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class UpdateNotificationSettings {
  @joiValidation(notificationSettingsSchema)
  /**
   *
   * edit basic info
   *
   */
  public async notification(req: Request, res: Response): Promise<void> {
    await userCache.updateSingleUserFromCache(`${req.currentUser!.id}`, 'notifications', JSON.stringify(req.body));
    userQueue.updateUserDataJob('updateNotificationSettings', {
      key: `${req.currentUser!.id}`,
      value: {
        notifications: req.body
      }
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Notification settings updated successfully', settings: req.body });
  }
}
