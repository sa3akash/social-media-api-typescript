import { authMiddleware } from '@globals/helpers/authMiddleware';
import express, { Router } from 'express';
import { UploadFileController } from '@root/features/upload/controller';

class UploadFile {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/upload', authMiddleware.verifyUser, UploadFileController.prototype.upload);
    this.router.get('/stream/:url', authMiddleware.verifyUser, UploadFileController.prototype.streams);
 

    return this.router;
  }
}

export const uploadFile: UploadFile = new UploadFile();
