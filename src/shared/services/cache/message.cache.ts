import { IChatList, IChatUsers, IGetMessageFromCache, IMessageData } from '@chat/interfaces/chat.interfaces';
import { ServerError } from '@globals/helpers/errorHandler';
import { BaseCache } from '@services/cache/base.cache';
import { cloneDeep, filter, find, findIndex, remove } from 'lodash';
import { userCache } from '@services/cache/user.cache';
import { FullUserDoc } from '@auth/interfaces/auth.interface';
import { IReaction } from '@reaction/interfaces/reaction.interface';

class MessageCache extends BaseCache {
  constructor() {
    super('message-cache');
  }

  public async addChatListToCache(senderId: string, receiverId: string, conversationId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);

      // if this doesn't exist any conversation
      if (userChatList.length === 0) {
        await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
      } else {
        // if this user have an conversation then find index
        const receiverIndex: number = findIndex(userChatList, (list: string) => list.includes(receiverId));
        if (receiverIndex < 0) {
          await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
        }
      }
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async checkConversationIdCache(senderId: string, receiverId: string): Promise<string | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);

      const conversationData = find(userChatList, (conversation: string) => conversation.includes(receiverId)) as string;

      if (conversationData) {
        const conversationObj = JSON.parse(`${conversationData}`);
        return conversationObj?.conversationId ? conversationObj.conversationId : null;
      } else {
        return null;
      }
    } catch (err) {
      console.log(err);
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async addChatMessageToCache(data: IMessageData): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      delete data['receiverObject'];
      delete data['senderObject'];

      await this.client.LPUSH(`messages:${data.conversationId}`, JSON.stringify(data));
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async addUserChatToCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const users: IChatUsers[] = await this.getUserChatListToCache();

      const userIndex: number = findIndex(users, (user: IChatUsers) => JSON.stringify(user) === JSON.stringify(value));

      let chatUsers: IChatUsers[] = [];
      if (userIndex === -1) {
        await this.client.RPUSH('chatUsers', JSON.stringify(value));
        chatUsers = await this.getUserChatListToCache();
      } else {
        chatUsers = users;
      }

      return chatUsers;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
  public async removeUserChatToCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const users: IChatUsers[] = await this.getUserChatListToCache();

      const userIndex: number = findIndex(users, (user: IChatUsers) => JSON.stringify(user) === JSON.stringify(value));

      let chatUsers: IChatUsers[] = [];
      if (userIndex > -1) {
        await this.client.LREM('chatUsers', userIndex, JSON.stringify(value));
        chatUsers = await this.getUserChatListToCache();
      } else {
        chatUsers = users;
      }

      return chatUsers;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getUserChatListToCache(): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const chatUsersList: IChatUsers[] = [];
      const chatUsers = await this.client.LRANGE('chatUsers', 0, -1);

      for (const item of chatUsers) {
        const chatUser = JSON.parse(item);
        chatUsersList.push(chatUser);
      }

      return chatUsersList;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getUserConversationListCache(key: string): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList: string[] = await this.client.LRANGE(`chatList:${key}`, 0, -1);
      const conversationChatList: IMessageData[] = [];

      for (const item of userChatList) {
        const chatItem: IChatList = JSON.parse(item) as IChatList;
        const data = await this.getLatestMessageCache(chatItem.conversationId);
        conversationChatList.push(data);
      }

      return conversationChatList.sort((a, b) => {
        const createdAtA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const createdAtB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return createdAtB - createdAtA;
      });
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async getChatMessageCache(conversationId: string, start: number, end: number): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const messagesList: string[] = await this.client.LRANGE(`messages:${conversationId}`, start, end);
      const allMessages: IMessageData[] = [];

      for (const item of messagesList) {
        const singleMessage: IMessageData = JSON.parse(item) as IMessageData;
        const receiverUser: FullUserDoc = await userCache.getUserByIdFromCache(singleMessage.receiverId);
        const senderUser: FullUserDoc = await userCache.getUserByIdFromCache(singleMessage.senderId);

        const data = {
          ...singleMessage,
          receiverObject: {
            authId: receiverUser.authId as string,
            avatarColor: receiverUser.avatarColor,
            coverPicture: receiverUser.coverPicture,
            email: receiverUser.email,
            name: receiverUser.name,
            profilePicture: receiverUser.profilePicture,
            uId: receiverUser.uId,
            username: receiverUser.username
          },
          senderObject: {
            authId: senderUser.authId as string,
            avatarColor: senderUser.avatarColor,
            coverPicture: senderUser.coverPicture,
            email: senderUser.email,
            name: senderUser.name,
            profilePicture: senderUser.profilePicture,
            uId: senderUser.uId,
            username: senderUser.username
          }
        } as IMessageData;

        allMessages.push(data);
      }

      return allMessages.sort((a, b) => {
        const createdAtA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const createdAtB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return createdAtB - createdAtA;
      });
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async deleteMessageCache(
    conversationId: string,
    messageId: string,
    type: 'deleteForMe' | 'deleteForEveryone'
  ): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const { index, message }: IGetMessageFromCache = await this.getSingleMessageCache(conversationId, messageId);

      if (type === 'deleteForMe') {
        message.deleteForMe = true;
      } else {
        message.deleteForEveryone = true;
      }
      const savedMessage = cloneDeep(message);
      delete savedMessage['senderObject'];
      delete savedMessage['receiverObject'];
      await this.client.LSET(`messages:${conversationId}`, index, JSON.stringify(savedMessage));

      return message;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async updateIsReadMessageCache(conversationId: string, authId: string): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const allMessages = await this.client.LRANGE(`messages:${conversationId}`, 0, -1);

      const userMessage = filter(allMessages, (m: string) => JSON.parse(m).receiverId === authId && !JSON.parse(m).isRead);

      for (const message of userMessage) {
        const singleMessage: IMessageData = JSON.parse(message);
        const index: number = findIndex(allMessages, (message: string) => message.includes(`${singleMessage._id}`)) as number;
        singleMessage.isRead = true;
        await this.client.LSET(`messages:${conversationId}`, index, JSON.stringify(singleMessage));
      }
      return await this.getLatestMessageCache(conversationId);
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  public async updateMessageReactionCache(
    conversationId: string,
    messageId: string,
    senderName: string,
    type: string
  ): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const allMessages: string[] = await this.client.LRANGE(`messages:${conversationId}`, 0, -1);
      const index: number = findIndex(allMessages, (m: string) => m.includes(messageId));
      const singleMessage: IMessageData = JSON.parse((await this.client.LINDEX(`messages:${conversationId}`, index)) as string);

      // const reactions: IReaction[] = [];

      if (singleMessage) {
        if (singleMessage.reaction?.some((reaction: IReaction) => reaction.senderName === senderName && reaction.type === type)) {
          remove(singleMessage.reaction, (reaction: IReaction) => reaction.senderName === senderName);
        } else {
          remove(singleMessage.reaction, (reaction: IReaction) => reaction.senderName === senderName);
          singleMessage.reaction.push({
            senderName,
            type
          });
        }
        await this.client.LSET(`messages:${conversationId}`, index, JSON.stringify(singleMessage));
      }
      return await this.getLatestMessageCache(conversationId);
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  private async getLatestMessageCache(conversationId: string): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const lastMessage: string = (await this.client.LINDEX(`messages:${conversationId}`, 0)) as string;
      const lastMessageData: IMessageData = JSON.parse(lastMessage);
      const receiverUser: FullUserDoc = await userCache.getUserByIdFromCache(lastMessageData.receiverId);
      const senderUser: FullUserDoc = await userCache.getUserByIdFromCache(lastMessageData.senderId);

      const data = {
        ...lastMessageData,
        receiverObject: {
          authId: receiverUser.authId as string,
          avatarColor: receiverUser.avatarColor,
          coverPicture: receiverUser.coverPicture,
          email: receiverUser.email,
          name: receiverUser.name,
          profilePicture: receiverUser.profilePicture,
          uId: receiverUser.uId,
          username: receiverUser.username
        },
        senderObject: {
          authId: senderUser.authId as string,
          avatarColor: senderUser.avatarColor,
          coverPicture: senderUser.coverPicture,
          email: senderUser.email,
          name: senderUser.name,
          profilePicture: senderUser.profilePicture,
          uId: senderUser.uId,
          username: senderUser.username
        }
      } as IMessageData;

      return data;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }

  private async getSingleMessageCache(conversationId: string, messageId: string): Promise<IGetMessageFromCache> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const messagesList: string[] = await this.client.LRANGE(`messages:${conversationId}`, 0, -1);

      const singleMessage: string = find(messagesList, (message: string) => message.includes(messageId)) as string;
      const singleIndex: number = findIndex(messagesList, (message: string) => message.includes(messageId)) as number;
      const singleMessageData: IMessageData = JSON.parse(singleMessage) as IMessageData;
      const receiverUser: FullUserDoc = await userCache.getUserByIdFromCache(singleMessageData.receiverId);
      const senderUser: FullUserDoc = await userCache.getUserByIdFromCache(singleMessageData.senderId);

      const data = {
        ...singleMessageData,
        receiverObject: {
          authId: receiverUser.authId as string,
          avatarColor: receiverUser.avatarColor,
          coverPicture: receiverUser.coverPicture,
          email: receiverUser.email,
          name: receiverUser.name,
          profilePicture: receiverUser.profilePicture,
          uId: receiverUser.uId,
          username: receiverUser.username
        },
        senderObject: {
          authId: senderUser.authId as string,
          avatarColor: senderUser.avatarColor,
          coverPicture: senderUser.coverPicture,
          email: senderUser.email,
          name: senderUser.name,
          profilePicture: senderUser.profilePicture,
          uId: senderUser.uId,
          username: senderUser.username
        }
      } as IMessageData;

      return { index: singleIndex, message: data } as IGetMessageFromCache;
    } catch (err) {
      throw new ServerError('Internal Server Error, Try again later.');
    }
  }
}

export const messageCache: MessageCache = new MessageCache();
