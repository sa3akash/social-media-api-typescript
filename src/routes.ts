import { authRoutes } from '@auth/routes/auth.routes';
import { chatRoutes } from '@chat/routes/chat.routes';
import { commentRoutes } from '@comment/routes/comment.routes';
import { followRoutes } from '@follower/routes/follower.routes';
import { notificationRoutes } from '@notification/routes/notification.routes';
import { postRoutes } from '@post/routes/post.routes';
import { reactionRoutes } from '@reaction/routes/routes';
import { serverAdapter } from '@services/queues/base.queue';
import { usersRoutes } from '@user/routes/user.routes';
import { Application } from 'express';
import { linkRoutes } from '@root/features/link/routes';
import { uploadFile } from '@root/features/upload/routes';
import { liveRoutes } from '@root/features/goLive/routes/LiveRoutes';
import { commenDRoutes } from './features/commend/commentRoutes';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, postRoutes.routes());
    app.use(BASE_PATH, reactionRoutes.routes());
    app.use(BASE_PATH, commentRoutes.routes());
    app.use(BASE_PATH, followRoutes.routes());
    app.use(BASE_PATH, notificationRoutes.routes());
    app.use(BASE_PATH, chatRoutes.routes());
    app.use(BASE_PATH, usersRoutes.routes());
    app.use(BASE_PATH, linkRoutes.routes());
    app.use(BASE_PATH, uploadFile.routes());
    app.use(BASE_PATH, liveRoutes.routes());
    app.use(BASE_PATH, commenDRoutes.routes());
    app.use('/queues', serverAdapter.getRouter());
  };
  routes();
};
