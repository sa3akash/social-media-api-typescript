import { IMessageData } from '@chat/interfaces/chat.interfaces';
import { messageCache } from '@services/cache/message.cache';
import { chatQueue } from '@services/queues/chat.queue';
import { connectedUsersMap, socketIoUserObject } from '@sockets/user.socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class DeleteChatController {
  public async markDelete(req: Request, res: Response): Promise<void> {
    const { conversationId, messageId, type } = req.body;

    const updateMessage: IMessageData = await messageCache.deleteMessageCache(conversationId, messageId, type);

    // socketIoChatObject.emit('mark-delete-message', updateMessage);
    // socketIoChatObject.emit('chat-list', updateMessage);

    chatQueue.markDeleteMessageJob('markDeleteInDB', {
      messageId,
      type
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message mark as deleted.' });
  }

  public async markRead(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params;

    const updateMessage: IMessageData = await messageCache.updateIsReadMessageCache(conversationId, `${req.currentUser?.id}`);

    // socketIoChatObject.emit('mark-read-message', updateMessage);

    const receiverId = updateMessage.senderId === `${req.currentUser?.id}` ? updateMessage.receiverId : updateMessage.senderId;
    const senderId = updateMessage.senderId === `${req.currentUser?.id}` ? updateMessage.senderId : updateMessage.receiverId;

    const reveiverSocket = connectedUsersMap.get(receiverId) as string[];
    const senderSocket = connectedUsersMap.get(senderId) as string[];

    socketIoUserObject.to(reveiverSocket).emit('chat-list-mark', updateMessage);
    socketIoUserObject.to(senderSocket).emit('chat-list-mark', updateMessage);
    socketIoUserObject.to(reveiverSocket).emit('message-mark', updateMessage);
    socketIoUserObject.to(senderSocket).emit('message-mark', updateMessage);

    chatQueue.markReadMessageJob('markReadInDB', {
      conversationId,
      authId: `${req.currentUser?.id}`
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message mark as read.', updateMessage });
  }
}
