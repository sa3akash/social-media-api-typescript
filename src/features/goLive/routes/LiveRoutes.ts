import { authMiddleware } from '@globals/helpers/authMiddleware';
import express, { Router } from 'express';
import { GoLiveController } from '../controllers/goLiveController';

class LiveRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/stream/cleanup', GoLiveController.prototype.clean);
    this.router.post('/stream/authenticate', GoLiveController.prototype.authenticateStream);
    this.router.post('/stream/recorded', GoLiveController.prototype.streamRecordEnd);
    this.router.post('/stream/start', authMiddleware.verifyUser, GoLiveController.prototype.start);
    this.router.post('/stream/end', authMiddleware.verifyUser, GoLiveController.prototype.streamStop);
    this.router.get('/streams/key', authMiddleware.verifyUser, GoLiveController.prototype.getStreamKey);
    this.router.put('/stream/reset', authMiddleware.verifyUser, GoLiveController.prototype.reSet);

    return this.router;
  }
}

export const liveRoutes: LiveRoutes = new LiveRoutes();
