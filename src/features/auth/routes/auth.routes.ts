import { CurrentUser } from '@auth/controllers/currentUser.controller';
import { SigninController } from '@auth/controllers/signin.controller';
import { SignOut } from '@auth/controllers/signout.controller';
import { SignupController } from '@auth/controllers/signup.controller';
import { authMiddleware } from '@globals/helpers/authMiddleware';
import express, { Router } from 'express';

class AuthRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/signup', SignupController.prototype.signup);
    this.router.post('/signin', SigninController.prototype.read);
    this.protectedRoutes();
    return this.router;
  }
  private protectedRoutes() {
    this.router.get('/current-user', authMiddleware.verifyUser, CurrentUser.prototype.getFullUser);
    this.router.get('/signout', authMiddleware.verifyUser, SignOut.prototype.logout);
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
