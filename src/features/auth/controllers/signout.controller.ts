import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class SignOut {
  public async logout(req: Request, res: Response): Promise<void> {
    req.session = null;
    res.status(HTTP_STATUS.OK).json({ message: 'Logout successfully.' });
  }
}
