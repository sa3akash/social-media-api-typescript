import { authRoutes } from '@auth/routes/auth.routes';
import { serverAdapter } from '@services/queues/base.queue';
import { Application } from 'express';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use(BASE_PATH, authRoutes.routes());
    app.use('/queues', serverAdapter.getRouter());
  };
  routes();
};
