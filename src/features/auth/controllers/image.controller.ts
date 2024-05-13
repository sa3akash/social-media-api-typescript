import { usernameSchema } from '@auth/schemas/usernameSchemaJoi copy';
import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { userCache } from '@services/cache/user.cache';
import { authService } from '@services/db/auth.services';
import { authQueue } from '@services/queues/auth.queue';
import { socketIoPostObject } from '@sockets/post.sockets';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class ImageAuthController {
  public async profileImage(req: Request, res: Response): Promise<void> {
    const profileImageUrl = req.file;
    const user = await userCache.updateSingleUserFromCache(`${req.currentUser?.id}`, 'profilePicture', `${profileImageUrl?.path}`);

    socketIoPostObject.emit('update-user', user);

    authQueue.updateProfileImageJob('updateProfilePicDB', {
      authId: `${req.currentUser?.id}`,
      imageUrl: `${profileImageUrl?.path}`
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Profile image uploaded successfully.', url: user.profilePicture });
  }

  public async coverImage(req: Request, res: Response): Promise<void> {
    const coverImageUrl = req.file;
    const user = await userCache.updateSingleUserFromCache(`${req.currentUser?.id}`, 'coverPicture', `${coverImageUrl?.path}`);

    socketIoPostObject.emit('update-user', user);

    authQueue.updateProfileImageJob('updateCoverPicInDB', {
      authId: `${req.currentUser?.id}`,
      imageUrl: `${coverImageUrl?.path}`
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Cover image uploaded successfully.', url: user.coverPicture });
  }

  @joiValidation(usernameSchema)
  public async updateUsername(req: Request, res: Response): Promise<void> {
    const { username } = req.body;

    const validateUsername = await authService.getAuthUserByUsername(`${username}`);

    if (validateUsername) throw new BadRequestError('username already in use.');

    const user = await userCache.updateSingleUserFromCache(`${req.currentUser?.id}`, 'username', `${username}`);

    socketIoPostObject.emit('update-user', user);

    authQueue.updateUsernameJob('updateUsernameInDB', {
      authId: `${req.currentUser?.id}`,
      username: `${username}`
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Username updated successfully.',username });
  }

  public async checkUsername(req: Request, res: Response): Promise<void> {
    const { username } = req.query;
    if (!username) throw new BadRequestError('Please provide an username.');

    const validateUsername = await authService.getAuthUserByUsername(`${username}`);
    if (validateUsername) throw new BadRequestError('Username already in use.');

    res.status(HTTP_STATUS.OK).json({ message: 'You can use this username' });
  }
}
