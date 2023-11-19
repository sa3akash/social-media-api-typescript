/* eslint-disable @typescript-eslint/no-unused-vars */
// internal module
import http from 'http';
// external libraries
import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieSession from 'cookie-session';
import compression from 'compression';
import HTTP_STATUS from 'http-status-codes';
import 'express-async-errors';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
// // custom file
import { config } from '@root/config';
import applicationRoutes from '@root/routes';
import { CustomError } from '@globals/helpers/errorHandler';
import { IErrorResponse } from '@shared/types/errorTypes';
import { SocketIoPostHandler } from '@sockets/post.sockets';
import { SocketIoFollowHandler } from '@sockets/follower.socket';
import { SocketIoNotificationHandler } from '@sockets/notification.socket';

const log = config.createLogger('setup server');

/**
 *
 * Setup server class
 *
 */

export class SetupServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: 'sessions',
        keys: [config.SECRET_KEY_1!, config.SECRET_KEY_2!],
        httpOnly: true,
        secure: config.NODE_ENV !== 'development',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));
  }

  private routesMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  private globalErrorHandler(app: Application): void {
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found.` });
    });

    app.use((err: IErrorResponse, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof CustomError) {
        res.status(err.statusCode).json(err.serializeErrors());
      } else {
        res
          .status(500)
          .json({ message: err.message || 'Internal Server Error', status: err.status || 'error', statusCode: err.statusCode || 500 });
      }
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = http.createServer(app);
      this.startHttpServer(httpServer);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.socketIoConnection(socketIO);
    } catch (err) {
      log.error(err);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      }
    });
    const pubClient = createClient({ url: config.REDIS_URL! });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    httpServer.listen(config.PORT, () => {
      log.info(`STARTING SERVER ON PORT ${config.PORT} PROCESS ID =${process.pid}`);
    });
  }

  private socketIoConnection(io: Server): void {
    const postSocketHandler: SocketIoPostHandler = new SocketIoPostHandler(io);
    const socketIoFollowHandler: SocketIoFollowHandler = new SocketIoFollowHandler(io);
    const socketIoNotificationHandler: SocketIoNotificationHandler = new SocketIoNotificationHandler();
    // listen
    postSocketHandler.listen();
    socketIoFollowHandler.listen();
    socketIoNotificationHandler.listen(io);
  }
}
