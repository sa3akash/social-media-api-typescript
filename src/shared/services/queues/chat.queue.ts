import { IMarkDeleteMessage, IMarkReadMessage, IMessageData, IReactionMessage } from '@chat/interfaces/chat.interfaces';
import { BaseQueue } from '@services/queues/base.queue';
import { chatWorker } from '@workers/chat.worker';

class ChatQueue extends BaseQueue {
  constructor() {
    super('chatQueue');
    this.processJob('addMessageDataInDB', 5, chatWorker.addMessage);
    this.processJob('markDeleteInDB', 5, chatWorker.markDelete);
    this.processJob('markReadInDB', 5, chatWorker.markRead);
    this.processJob('reactionMessageInDB', 5, chatWorker.reactionMessageRead);
  }

  public addMessageJob(name: string, data: IMessageData): void {
    this.addJob(name, data);
  }

  public markDeleteMessageJob(name: string, data: IMarkDeleteMessage): void {
    this.addJob(name, data);
  }

  public markReadMessageJob(name: string, data: IMarkReadMessage): void {
    this.addJob(name, data);
  }
  public updateReactionMessageJob(name: string, data: IReactionMessage): void {
    this.addJob(name, data);
  }
}

export const chatQueue: ChatQueue = new ChatQueue();
