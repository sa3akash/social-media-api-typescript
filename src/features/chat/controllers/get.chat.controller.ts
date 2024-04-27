import { IMessageData } from '@chat/interfaces/chat.interfaces';
import { messageCache } from '@services/cache/message.cache';
import { chatService } from '@services/db/chat.services';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const PAGE_SIZE = 20;

export class getConversationController {
  public async getConversations(req: Request, res: Response): Promise<void> {
    const conversationListInCache: IMessageData[] = await messageCache.getUserConversationListCache(`${req.currentUser?.id}`);
    const conversationList: IMessageData[] =
      conversationListInCache.length > 0 ? conversationListInCache : await chatService.getUserConversationDB(`${req.currentUser?.id}`);

    res.status(HTTP_STATUS.OK).json({ message: 'User conversation list', conversationList });
  }

  public async getMessagess(req: Request, res: Response): Promise<void> {
    const conversationId: string = req.params.conversationId;
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;
    const newSkip: number = skip === 0 ? skip : skip + 1;

    const messagesCache = await messageCache.getChatMessageCache(`${req.currentUser?.id}`,conversationId, newSkip, limit);
    const messages = messagesCache.length ? messagesCache : await chatService.getMessagesDB(conversationId, skip, limit);

    const numberOfMessageCache: number = await messageCache.getNumberOfMessages(conversationId);
    const getNumberOfMessage = numberOfMessageCache ? numberOfMessageCache : await chatService.getNumberOfMessageDB(conversationId);
    // response
    res.status(HTTP_STATUS.OK).json({
      message: 'Get all messages successfully.',
      messages: messages,
      currentPage: Number(page),
      numberOfPages: Math.ceil(getNumberOfMessage / PAGE_SIZE)
    });
  }
}
