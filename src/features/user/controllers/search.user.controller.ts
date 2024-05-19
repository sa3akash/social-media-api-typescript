import { Utils } from '@globals/helpers/utils';
import { userService } from '@services/db/user.services';
import { ISearchUser } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const PAGE_SIZE = 10;

export class SearchUser {
  public async user(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const regex = new RegExp(Utils.escapeRegex(req.params.search), 'i');
    const users: ISearchUser[] = await userService.searchUsers(regex, skip, limit, `${req.currentUser?.id}`);
    const numberOfPosts: number = await userService.searchUsersCount(regex, `${req.currentUser?.id}`);

    res.status(HTTP_STATUS.OK).json({
      message: 'Get all search users successfully.',
      users: users,
      currentPage: Number(page),
      numberOfPages: Math.ceil(numberOfPosts / PAGE_SIZE)
    });
  }
}
