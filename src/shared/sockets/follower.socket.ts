import { IFollowers } from '@follower/interfaces/follower.interface';
import { Server, Socket } from 'socket.io';

export let socketIoFollowObject: Server;

export class SocketIoFollowHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIoFollowObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('unfollow-user', (data: IFollowers) => {
        this.io.emit('remove-follower', data);
      });
    });
  }
}
