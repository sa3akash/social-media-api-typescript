import { userCache } from '@services/cache/user.cache';
import { authQueue } from '@services/queues/auth.queue';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class ImageAuthController {
  public async profileImage(req: Request, res: Response): Promise<void> {
    const profileImageUrl = req.file;
    const user = await userCache.updateSingleUserFromCache(`${req.currentUser?.id}`, 'profilePicture', `${profileImageUrl?.path}`);

    authQueue.updateProfileImageJob('updateProfilePicDB', {
      authId: `${req.currentUser?.id}`,
      imageUrl: `${profileImageUrl?.path}`
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Profile image uploaded successfully.', user });
  }

  public async coverImage(req: Request, res: Response): Promise<void> {
    const coverImageUrl = req.file;
    const user = await userCache.updateSingleUserFromCache(`${req.currentUser?.id}`, 'coverPicture', `${coverImageUrl?.path}`);

    authQueue.updateProfileImageJob('updateCoverPicInDB', {
      authId: `${req.currentUser?.id}`,
      imageUrl: `${coverImageUrl?.path}`
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Cover image uploaded successfully.', user });
  }
}
