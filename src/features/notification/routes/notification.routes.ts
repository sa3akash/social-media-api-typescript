import { authMiddleware } from '@globals/helpers/authMiddleware';
import { NotificationController } from '@notification/controllers/notification.controller';
import express, { Router } from 'express';

class NotificationRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.put('/notification/:notificationId', authMiddleware.verifyUser, NotificationController.prototype.updateNotification);
    this.router.delete('/notification/:notificationId', authMiddleware.verifyUser, NotificationController.prototype.deleteNotification);
    this.router.get('/notifications', authMiddleware.verifyUser, NotificationController.prototype.getNotification);

    return this.router;
  }
}

export const notificationRoutes: NotificationRoutes = new NotificationRoutes();
