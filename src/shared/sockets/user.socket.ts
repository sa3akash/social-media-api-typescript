import { ILogin } from '@user/interfaces/user.interface';
import { Server, Socket } from 'socket.io';

export let socketIoUserObject: Server;

export const connectedUsersMap: Map<string, string> = new Map();

let users: string[] = [];

export class SocketIoUserHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIoUserObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('setup', (data: ILogin) => {
        this.addClientToMap(data.authId, socket.id);
        this.addUser(data.authId);
        this.io.emit('user-online', users);
      });

      // const {authId} = socket.handshake.query;
      // console.log(authId);

      socket.on('disconnect', () => {
        this.removeClientFromMap(socket.id);
      });
    });
  }

  /**
   *
   * add client to map function
   *
   */
  private addClientToMap(authId: string, socketId: string): void {
    if (!connectedUsersMap.has(authId)) {
      connectedUsersMap.set(authId, socketId);
    }
  }
  /**
   *
   * add client to map function
   *
   */
  private addUser(authId: string): void {
    users.push(authId);
    users = [...new Set(users)];
  }

  /**
   *
   * remove user to users function
   *
   */
  private removeUser(authId: string): void {
    users = users.filter((id: string) => id !== authId);
  }
  /**
   *
   * remove client to map function
   *
   */
  private removeClientFromMap(socketId: string): void {
    if (Array.from(connectedUsersMap.values()).includes(socketId)) {
      const disconnectedUser: [string, string] = [...connectedUsersMap].find((user: [string, string]) => {
        return user[1] === socketId;
      }) as [string, string];

      connectedUsersMap.delete(disconnectedUser[0]);
      this.removeUser(disconnectedUser[0]);
      this.io.emit('user-online', users);
    }
  }
}
