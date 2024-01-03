import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@root/config';
import { UnAuthorized } from '@shared/globals/helpers/errorHandler';
import { AuthPayload } from '@auth/interfaces/auth.interface';

class AuthMiddleware {
  public verifyUser(req: Request, res: Response, next: NextFunction): void {
    if (!req.session?.token) {
      throw new UnAuthorized('Token is not available. Please login again.');
    }
    try {
      const payload: AuthPayload = jwt.verify(req.session?.token, config.JWT_SEC!) as AuthPayload;
      req.currentUser = payload;
    } catch (err) {
      throw new UnAuthorized('Token is invalid. Please login again.');
    }
    next();
  }

  public checkAuthentication(req: Request, res: Response, next: NextFunction): void {
    if (!req.currentUser) {
      throw new UnAuthorized('Authentication is required to access this routes. Please login again.');
    }
    next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
