import { BaseQueue } from '@services/queues/base.queue';
import { liveWorker } from '@workers/live.worker';

class LiveQueue extends BaseQueue {
  constructor() {
    super('LiveQueue');
    this.processJob('goLive', 5, liveWorker.createLive);
    this.processJob('recordEnd', 5, liveWorker.recordEnd);
  }

  public addPostJob(name: string, data: string): void {
    this.addJob(name, data);
  }
  public recordEnd(name: string, data: string): void {
    this.addJob(name, data);
  }
}

export const liveQueue: LiveQueue = new LiveQueue();
