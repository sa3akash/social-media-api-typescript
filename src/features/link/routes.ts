import { authMiddleware } from '@globals/helpers/authMiddleware';
import express, { Router } from 'express';
import { LinkPreviewController } from './controller';

class LinkRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/link-preview', authMiddleware.verifyUser,LinkPreviewController.prototype.getLinkMetadata);


    return this.router;
  }
}

export const linkRoutes: LinkRoutes = new LinkRoutes();
