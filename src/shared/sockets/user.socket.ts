import { messageCache } from '@services/cache/message.cache';
import { chatQueue } from '@services/queues/chat.queue';
import { Server, Socket } from 'socket.io';

export let socketIoUserObject: Server;

export const connectedUsersMap: Map<string, string[]> = new Map();

export class SocketIoUserHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIoUserObject = io;
  }

  public listen(): void {
    this.io.use((socket, next) => {
      const authId = socket.handshake.query.authId as string;
      if (authId !== 'undefined') {
        this.addClientToMap(authId, socket.id);
        this.chatWebrtc(socket);
        next();
      }
    });

    this.io.on('connection', (socket: Socket) => {
      this.io.emit('user-online', [...connectedUsersMap.keys()]);

      socket.on('markAsMessage', async ({ conversationId, messageSenderId, messageSeenId }) => {
        await messageCache.updateIsReadMessageCache(conversationId, messageSeenId);
        chatQueue.markReadMessageJob('markReadInDB', {
          conversationId,
          authId: messageSeenId
        });

        const reveiverSocket = connectedUsersMap.get(messageSenderId) as string[];

        socketIoUserObject.to(reveiverSocket).emit('chat-mark', { conversationId });
      });

      socket.on('disconnect', () => {
        this.removeClientFromMap(socket);
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
      connectedUsersMap.set(authId, [socketId]);
    } else {
      const value = connectedUsersMap.get(authId) as string[];
      connectedUsersMap.set(authId, [...value, socketId]);
    }
  }

  /**
   *
   * remove client to map function
   *
   */
  private removeClientFromMap(socket: Socket): void {
    const authId = socket.handshake.query.authId as string;
    const value = connectedUsersMap.get(authId) as string[];

    if (value?.length > 1) {
      connectedUsersMap.set(
        authId,
        value.filter((id) => id !== socket.id)
      );
    } else {
      connectedUsersMap.delete(authId);
    }
    this.io.emit('user-online', [...connectedUsersMap.keys()]);
  }
  private chatWebrtc(socket: Socket): void {
    socket.on('offer', ({ type, user, from, to, offer, conversationId }) => {
      const receiverId = connectedUsersMap.get(to) as string[];

      if (!receiverId?.length) {
        socket.emit('offline');
      }

      socket.to(receiverId).emit('offer', {
        offer: offer,
        to: from,
        user: user,
        type: type,
        conversationId
      });
    });

    socket.on('cancelCall', ({ to }) => {
      const cencelUserId = connectedUsersMap.get(to) as string[];
      socket.to(cencelUserId).emit('cancelCall');
    });

    socket.on('answer', ({ to, answer, conversationId }) => {
      const caller = connectedUsersMap.get(to) as string[];
      socket.to(caller).emit('answer', { answer, conversationId });
    });
  }
}
