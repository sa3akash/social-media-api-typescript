import { FullUserDoc, NameDoc } from '@auth/interfaces/auth.interface';
import { IChatUsers, IMessageData } from '@chat/interfaces/chat.interfaces';
import { addChatSchema } from '@chat/schemas/chat.shema.joi';
import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { messageCache } from '@services/cache/message.cache';
import { userCache } from '@services/cache/user.cache';
import { authService } from '@services/db/auth.services';
import { chatQueue } from '@services/queues/chat.queue';
import { socketIoChatObject } from '@sockets/chat.socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { cloneDeep } from 'lodash';
import { ObjectId } from 'mongodb';

export class AddChatController {
  @joiValidation(addChatSchema)
  public async message(req: Request, res: Response): Promise<void> {
    // get receiver user data

    if (req.body?.receiverId === req.currentUser?.id) {
      throw new BadRequestError('Your can not chat yourself.');
    }
    const messageData: IMessageData = await AddChatController.prototype.readyMessageData(req);
    AddChatController.prototype.emitSocketIOEvent(messageData);
    // add sender to chat list
    // add receiver to chat list
    // add message to cache
    // save message to db
    await messageCache.addChatListToCache(messageData.senderId, messageData.receiverId, messageData.conversationId);
    await messageCache.addChatListToCache(messageData.receiverId, messageData.senderId, messageData.conversationId);
    await messageCache.addChatMessageToCache(cloneDeep(messageData));
    chatQueue.addMessageJob('addMessageDataInDB', messageData);
    // send response for client
    res.status(HTTP_STATUS.OK).json({ message: 'Message added successfully', conversationId: messageData.conversationId });
  }

  /**
   *
   * socketObject
   *
   */

  public async addChatUsers(req: Request, res: Response): Promise<void> {
    const data: IChatUsers = {
      userOne: `${req.currentUser?.id}`,
      userTwo: `${req.body.receiverId}`
    };
    const chatUsers = await messageCache.addUserChatToCache(data);
    // socketIo
    socketIoChatObject.emit('add-chat-user', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Chat users added.', chatUsers });
  }

  public async removeChatUsers(req: Request, res: Response): Promise<void> {
    const data: IChatUsers = {
      userOne: `${req.currentUser?.id}`,
      userTwo: `${req.body.receiverId}`
    };
    const chatUsers = await messageCache.removeUserChatToCache(data);
    // socketIo
    socketIoChatObject.emit('remove-chat-user', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Chat users removed.', chatUsers });
  }

  /**
   *
   * socketObject
   *
   */
  private emitSocketIOEvent(data: IMessageData): void {
    socketIoChatObject.emit('message-received', data);
    socketIoChatObject.emit('chat-list', data);
  }

  /**
   *
   * ready message data
   *
   */

  private async readyMessageData(req: Request): Promise<IMessageData> {
    const { conversationId, receiverId, body, gifUrl, isRead } = req.body;
    // create a objectId

    const convId: string = conversationId
      ? conversationId
      : await messageCache.checkConversationIdCache(`${req.currentUser?.id}`, receiverId);

    const conversationObjectId = convId ? convId : new ObjectId();
    const messageObjectId = new ObjectId();
    const cacheUser = await userCache.getUserByIdFromCache(`${receiverId}`);
    const receiverUserData: FullUserDoc = cacheUser.authId
      ? cacheUser
      : ((await authService.getAuthUserByAuthId(receiverId)) as FullUserDoc);

    const messageData: IMessageData = {
      _id: `${messageObjectId}`,
      conversationId: `${conversationObjectId}`,
      receiverId: `${receiverId}`,
      senderId: `${req.currentUser?.id}`,
      body: body,
      createdAt: new Date(),
      deleteForEveryone: false,
      deleteForMe: false,
      gifUrl: gifUrl || '',
      isRead: isRead === 'true' ? true : false,
      reaction: [],
      files: req.files ? req.files : [],
      senderObject: {
        authId: `${req.currentUser?.id}`,
        avatarColor: `${req.currentUser?.avatarColor}`,
        coverPicture: `${req.currentUser?.coverPicture}`,
        email: `${req.currentUser?.email}`,
        name: req.currentUser?.name as NameDoc,
        profilePicture: `${req.currentUser?.profilePicture}`,
        uId: `${req.currentUser?.uId}`,
        username: `${req.currentUser?.username}`
      },
      receiverObject: {
        authId: receiverUserData.authId as string,
        avatarColor: receiverUserData.avatarColor,
        coverPicture: receiverUserData.coverPicture,
        email: receiverUserData.email,
        name: receiverUserData.name,
        profilePicture: receiverUserData.profilePicture,
        uId: receiverUserData.uId,
        username: receiverUserData.username
      }
    } as unknown as IMessageData;

    return messageData;
  }
}
