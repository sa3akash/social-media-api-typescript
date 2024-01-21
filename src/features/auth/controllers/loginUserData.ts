import { userCache } from '@services/cache/user.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class LoginUserData {
  public async getData(req: Request, res: Response): Promise<void> {
    const cacheUser = await userCache.getLoginData(`${req.currentUser?.id}`);

    // const data = await userService.getLoginData(`${req.currentUser?.id}`);
    res.status(HTTP_STATUS.OK).json(cacheUser);
  }
}
