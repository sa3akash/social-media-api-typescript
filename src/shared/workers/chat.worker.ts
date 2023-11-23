import { DoneCallback, Job } from 'bull';
import { chatService } from '@services/db/chat.services';
import { IMarkDeleteMessage, IMarkReadMessage, IMessageData, IReactionMessage } from '@chat/interfaces/chat.interfaces';

class ChatWorker {
  async addMessage(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data: IMessageData = job.data;

      await chatService.addMessageDB(data);

      // if (data.isRead.includes('false')) {
      //   const receiverUser = await userCache.getUserByIdFromCache(data.receiverId);
      //   if (receiverUser?.notifications.messages) {
      //     const templateParams: INotificationTemplate = {
      //       username: receiverUser.name.first,
      //       message: data.body,
      //       header: `Message notification from ${data.senderObject?.name.first}`
      //     };
      //     const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      //     emailQueue.addEmailJob('reactionEmail', {
      //       receiverEmail: receiverUser.email!,
      //       template,
      //       subject: `You've received messages from ${data.senderObject?.name.first}`
      //     });
      //   }
      // }

      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async markDelete(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data: IMarkDeleteMessage = job.data;
      // update data in db
      await chatService.markDeleteMessageDB(data.messageId, data.type);

      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async markRead(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data: IMarkReadMessage = job.data;
      // update data in db
      await chatService.markReadMessageDB(data.conversationId, data.authId);

      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
  async reactionMessageRead(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data: IReactionMessage = job.data;
      // update data in db
      await chatService.updateReactionMessageDB(data.messageId, data.senderName, data.type);

      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const chatWorker: ChatWorker = new ChatWorker();
