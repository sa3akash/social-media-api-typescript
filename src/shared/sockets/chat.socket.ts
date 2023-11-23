import { ISenderReceiver } from '@chat/interfaces/chat.interfaces';
import { Server, Socket } from 'socket.io';

export let socketIoChatObject: Server;

export class SocketIoChatHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIoChatObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('join-room', (data: ISenderReceiver) => {
        console.log(data);
      });
    });
  }
}
