import { userCache } from '@services/cache/user.cache';
import { userService } from '@services/db/user.services';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const PAGE_SIZE = 10;

export class GetUsersController {
  async getAll(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const newSkip: number = skip === 0 ? skip : skip + 1;

    // get all users array from cache and db
    const allUsersCache = await userCache.getMultipleUsersCache(newSkip, limit, `${req.currentUser?.id}`);
    const getAllUsers = allUsersCache.length ? allUsersCache : await userService.getAllUsers(skip, limit, `${req.currentUser?.id}`);
    // get number of users
    const numberOfUsersCache: number = await userCache.getTotalNumberOfUsersFromCache();
    const numberOfPageUsers: number = numberOfUsersCache ? numberOfUsersCache : await userService.getNumberOfUsers();

    res.status(HTTP_STATUS.OK).json({
      users: getAllUsers,
      currentPage: Number(page),
      numberOfPages: Math.ceil(numberOfPageUsers / limit),
      message: 'Get all users.'
    });
  }

  public async randomUserSuggestions(req: Request, res: Response): Promise<void> {
    const randomCache = await userCache.getRandomUsersFromCache(`${req.currentUser?.id}`);
    const randomUsers = randomCache.length ? randomCache : await userService.getRandomAllUsers(`${req.currentUser?.id}`);

    res.status(HTTP_STATUS.OK).json({ message: 'User suggestions', users: randomUsers });
  }
}
