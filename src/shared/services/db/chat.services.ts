import { IMessageData } from '@chat/interfaces/chat.interfaces';
import { IConversationDocument } from '@chat/interfaces/convarsation.interfaces';
import { MessageModel } from '@chat/models/chat.model';
import { ConversationModel } from '@chat/models/conversation.model';
import { IReaction } from '@reaction/interfaces/reaction.interface';
import mongoose from 'mongoose';

class ChatServices {
  public async addMessageDB(data: IMessageData): Promise<void> {
    const conversationDoc = await ConversationModel.findById(data.conversationId);
    if (!conversationDoc) {
      await ConversationModel.create({
        _id: data.conversationId,
        senderId: data.senderId,
        receiverId: data.receiverId
      });
    }
    // save message data in db
    delete data['receiverObject'];
    delete data['senderObject'];
    await MessageModel.create(data);
  }

  public async getUserConversationDB(userId: string): Promise<IMessageData[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const messages: IMessageData[] = await MessageModel.aggregate([
      { $match: { $or: [{ senderId: userObjectId }, { receiverId: userObjectId }] } },
      { $group: { _id: '$conversationId', result: { $last: '$$ROOT' } } },
      { $lookup: { from: 'Auth', localField: 'result.senderId', foreignField: '_id', as: 'senderUser' } },
      { $unwind: '$senderUser' },
      { $lookup: { from: 'Auth', localField: 'result.receiverId', foreignField: '_id', as: 'receiverUser' } },
      { $unwind: '$receiverUser' },
      {
        $project: {
          _id: '$result._id',
          conversationId: '$result.conversationId',
          receiverId: '$result.receiverId',
          senderId: '$result.senderId',
          body: '$result.body',
          createdAt: '$result.createdAt',
          deleteForEveryone: '$result.deleteForEveryone',
          deleteForMe: '$result.deleteForMe',
          gifUrl: '$result.gifUrl',
          isRead: '$result.isRead',
          reaction: '$result.reaction',
          files: '$result.files',
          senderObject: {
            authId: '$senderUser._id',
            avatarColor: '$senderUser.avatarColor',
            coverPicture: '$senderUser.coverPicture',
            email: '$senderUser.email',
            name: '$senderUser.name',
            profilePicture: '$senderUser.profilePicture',
            uId: '$senderUser.uId',
            username: '$senderUser.username'
          },
          receiverObject: {
            authId: '$receiverUser._id',
            avatarColor: '$receiverUser.avatarColor',
            coverPicture: '$receiverUser.coverPicture',
            email: '$receiverUser.email',
            name: '$receiverUser.name',
            profilePicture: '$receiverUser.profilePicture',
            uId: '$receiverUser.uId',
            username: '$receiverUser.username'
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    return messages;
  }

  public async getMessagesDB(conversationId: string, skip: number, limit: number): Promise<IMessageData[]> {
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

    const messages: IMessageData[] = await MessageModel.aggregate([
      { $match: { conversationId: conversationObjectId } },
      { $sort: { createdAt: 1 } },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'Auth', localField: 'senderId', foreignField: '_id', as: 'senderUser' } },
      { $unwind: '$senderUser' },
      { $lookup: { from: 'Auth', localField: 'receiverId', foreignField: '_id', as: 'receiverUser' } },
      { $unwind: '$receiverUser' },
      { $project: this.aggregateConversationProject() }
    ]);
    return messages;
  }
  public async getNumberOfMessageDB(conversationId: string): Promise<number> {
    return MessageModel.find({ conversationId: conversationId }).countDocuments();
  }

  public async markDeleteMessageDB(messageId: string, type: 'deleteForMe' | 'deleteForEveryone'): Promise<void> {
    if (type === 'deleteForMe') {
      await MessageModel.findByIdAndUpdate(messageId, { $set: { deleteForMe: true } });
    } else {
      await MessageModel.findByIdAndUpdate(messageId, { $set: { deleteForEveryone: true } });
    }
  }

  public async checkConversationDB(senderId: string, receiverId: string): Promise<IConversationDocument> {
    return (await ConversationModel.findOne({ senderId: senderId, receiverId: receiverId })) as IConversationDocument;
  }

  public async markReadMessageDB(conversationId: string, authId: string): Promise<void> {
    const query = {
      $and: [{ conversationId }, { receiverId: authId }, { isRead: false }]
    };

    // await MessageModel.updateMany({conversationId,receiverId:authId}, { $set: { isRead: true } });
    await MessageModel.updateMany(query, { $set: { isRead: true } });
  }
  public async updateReactionMessageDB(messageId: string, senderName: string, type: string): Promise<void> {
    const singleMessage: IMessageData = (await MessageModel.findById(messageId)) as IMessageData;

    if (singleMessage) {
      if (singleMessage.reaction?.some((reaction: IReaction) => reaction.senderName === senderName && reaction.type === type)) {
        await MessageModel.updateOne({ _id: messageId }, { $pull: { reaction: { senderName } } });
      } else {
        await MessageModel.updateOne({ _id: messageId }, { $pull: { reaction: { senderName } } });
        await MessageModel.updateOne({ _id: messageId }, { $push: { reaction: { senderName, type } } });
      }
    }
  }

  private aggregateConversationProject(): IMessageData {
    return {
      _id: 1,
      conversationId: 1,
      receiverId: 1,
      senderId: 1,
      body: 1,
      createdAt: 1,
      deleteForEveryone: 1,
      deleteForMe: 1,
      gifUrl: 1,
      isRead: 1,
      reaction: 1,
      files: 1,
      senderObject: {
        authId: '$senderUser._id',
        avatarColor: '$senderUser.avatarColor',
        coverPicture: '$senderUser.coverPicture',
        email: '$senderUser.email',
        name: '$senderUser.name',
        profilePicture: '$senderUser.profilePicture',
        uId: '$senderUser.uId',
        username: '$senderUser.username'
      },
      receiverObject: {
        authId: '$receiverUser._id',
        avatarColor: '$receiverUser.avatarColor',
        coverPicture: '$receiverUser.coverPicture',
        email: '$receiverUser.email',
        name: '$receiverUser.name',
        profilePicture: '$receiverUser.profilePicture',
        uId: '$receiverUser.uId',
        username: '$receiverUser.username'
      }
    } as unknown as IMessageData;
  }
}

export const chatService: ChatServices = new ChatServices();
