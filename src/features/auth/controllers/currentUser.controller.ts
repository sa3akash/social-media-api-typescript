import { FullUserDoc } from '@auth/interfaces/auth.interface';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { userCache } from '@services/cache/user.cache';
import { userService } from '@services/db/user.services';
import { Request, Response } from 'express';

export class CurrentUser {
  public async getFullUser(req: Request, res: Response): Promise<void> {
    const authId = req.query.authId as string;
    if (!authId) {
      throw new BadRequestError('Auth is required.');
    }

    const cacheUser: FullUserDoc = await userCache.getUserByIdFromCache(authId);
    const fullUser: FullUserDoc = cacheUser ? cacheUser : await userService.getUserById(authId);

    if (!fullUser?._id) {
      throw new BadRequestError('Invalid user ID.');
    }

    res.json(fullUser);
  }
}
