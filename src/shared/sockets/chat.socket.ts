// import { ISenderReceiver } from '@chat/interfaces/chat.interfaces';
// import { Server, Socket } from 'socket.io';
// import { connectedUsersMap } from '@sockets/user.socket';

// export let socketIoChatObject: Server;

// export class SocketIoChatHandler {
//   private io: Server;

//   constructor(io: Server) {
//     this.io = io;
//     socketIoChatObject = io;
//   }

//   public listen(): void {
//     this.io.on('connection', (socket: Socket) => {
//       socket.on('join-room', (users: ISenderReceiver) => {
//         const { senderId, receiverId } = users;

//         // const senderSocketId: string = connectedUsersMap.get(senderId) as string;
//         // const receiverSocketId: string = connectedUsersMap.get(receiverId) as string;

//         // socket.join(senderSocketId);
//         // socket.join(receiverSocketId);
//       });
//     });
//   }
// }
