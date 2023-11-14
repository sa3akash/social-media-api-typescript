import { authRoutes } from '@auth/routes/auth.routes';
import { commentRoutes } from '@comment/routes/comment.routes';
import { postRoutes } from '@post/routes/post.routes';
import { reactionRoutes } from '@reaction/routes/routes';
import { serverAdapter } from '@services/queues/base.queue';
import { Application } from 'express';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, postRoutes.routes());
    app.use(BASE_PATH, reactionRoutes.routes());
    app.use(BASE_PATH, commentRoutes.routes());
    app.use('/queues', serverAdapter.getRouter());
  };
  routes();
};
