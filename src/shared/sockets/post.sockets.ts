import { config } from '@root/config';
import { Server, Socket } from 'socket.io';

const log = config.createLogger('postSocket');

export let socketIoPostObject: Server;

export class SocketIoPostHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIoPostObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      log.info(`Socket connection established. socketId: ${socket}`);
    });
  }
}
