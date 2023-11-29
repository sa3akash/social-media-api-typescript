import { authMiddleware } from '@globals/helpers/authMiddleware';
import { UpdatePasswordController } from '@user/controllers/changePassword';
import { GetUsersController } from '@user/controllers/get.user.controller';
import { SearchUser } from '@user/controllers/search.user.controller';
import { EditBasicInfo } from '@user/controllers/update.info.controller';
import { UpdateNotificationSettings } from '@user/controllers/update.settings';
import express, { Router } from 'express';

class UsersRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/users', authMiddleware.verifyUser, GetUsersController.prototype.getAll);
    this.router.get('/users/random', authMiddleware.verifyUser, GetUsersController.prototype.randomUserSuggestions);
    this.router.get('/users/:search', authMiddleware.verifyUser, SearchUser.prototype.user);
    this.router.put('/users/password-update', authMiddleware.verifyUser, UpdatePasswordController.prototype.password);
    this.router.put('/users/info-update', authMiddleware.verifyUser, EditBasicInfo.prototype.editInfo);
    this.router.put('/users/settings/notificaton', authMiddleware.verifyUser, UpdateNotificationSettings.prototype.notification);

    return this.router;
  }
}

export const usersRoutes: UsersRoutes = new UsersRoutes();
