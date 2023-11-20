import { CurrentUser } from '@auth/controllers/currentUser.controller';
import { ImageAuthController } from '@auth/controllers/image.controller';
import { PasswordController } from '@auth/controllers/password.controller';
import { SigninController } from '@auth/controllers/signin.controller';
import { SignOut } from '@auth/controllers/signout.controller';
import { SignupController } from '@auth/controllers/signup.controller';
import { authMiddleware } from '@globals/helpers/authMiddleware';
import { upload } from '@globals/helpers/cloudinaryUpload';
import express, { Router } from 'express';

class AuthRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/signup', SignupController.prototype.signup);
    this.router.post('/signin', SigninController.prototype.read);
    this.router.post('/forgot-password', PasswordController.prototype.resetPassword);
    this.router.post('/reset-password/:token', PasswordController.prototype.changePassword);
    this.protectedRoutes();
    return this.router;
  }
  private protectedRoutes() {
    this.router.get('/current-user', authMiddleware.verifyUser, CurrentUser.prototype.getFullUser);
    this.router.get('/signout', authMiddleware.verifyUser, SignOut.prototype.logout);
    this.router.put(
      '/update-profile-picture',
      authMiddleware.verifyUser,
      upload.single('file'),
      ImageAuthController.prototype.profileImage
    );
    this.router.put('/update-cover-picture', authMiddleware.verifyUser, upload.single('file'), ImageAuthController.prototype.coverImage);
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
