import { Server } from 'socket.io';

let socketIoNotificationObject: Server;

export class SocketIoNotificationHandler {
  public listen(io: Server): void {
    socketIoNotificationObject = io;
  }
}

export { socketIoNotificationObject };
