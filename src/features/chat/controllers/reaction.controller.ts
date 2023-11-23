import { IMessageData } from '@chat/interfaces/chat.interfaces';
import { messageCache } from '@services/cache/message.cache';
import { chatQueue } from '@services/queues/chat.queue';
import { socketIoChatObject } from '@sockets/chat.socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class ReactionChatController {
  public async reactionMessage(req: Request, res: Response): Promise<void> {
    const { conversationId, messageId, type } = req.body;

    const updateMessage: IMessageData = await messageCache.updateMessageReactionCache(
      conversationId,
      messageId,
      `${req.currentUser?.username}`,
      type
    );

    socketIoChatObject.emit('reaction-message', updateMessage);
    socketIoChatObject.emit('chat-list', updateMessage);

    chatQueue.updateReactionMessageJob('reactionMessageInDB', {
      messageId,
      senderName: `${req.currentUser?.username}`,
      type
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message reaction updated.', updateMessage });
  }
}
