// external libraries
import Queue, { Job } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import Logger from 'bunyan';
// custom files
import { config } from '@root/config';
import { IAuthJob } from '@auth/interfaces/auth.interface';
import { IEmailJob } from '@user/interfaces/user.interface';
import { IPostDocument, IPostJobData } from '@post/interfaces/post.interfaces';
import { IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ICommentDocument } from '@comment/interfaces/comment.interface';

type IBaseJobData = IAuthJob | IEmailJob | IPostDocument | IPostJobData | IReactionDocument | IReactionJob | ICommentDocument;

let bullAdapter: BullAdapter[] = [];
export let serverAdapter: ExpressAdapter;

export abstract class BaseQueue {
  queue: Queue.Queue;
  log: Logger;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, `${config.REDIS_URL}`);
    bullAdapter.push(new BullAdapter(this.queue));
    bullAdapter = [...new Set(bullAdapter)];
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: bullAdapter,
      serverAdapter
    });

    this.log = config.createLogger(`${queueName} - queue`);
    this.queue.on('completed', (job: Job) => {
      job.remove();
    });
    this.queue.on('global:completed', (jobId: string) => {
      this.log.info(`Job ${jobId} completed.`);
    });
    this.queue.on('global:stalled', (jobId: string) => {
      this.log.info(`Job ${jobId} stalled.`);
    });
  }

  protected addJob(name: string, data: IBaseJobData): void {
    this.queue.add(name, data, { attempts: 3, backoff: { type: 'fixed', delay: 5000 }, removeOnComplete: true, removeOnFail: true });
  }

  protected processJob(name: string, concurrency: number, callback: Queue.ProcessCallbackFunction<void>): void {
    this.queue.process(name, concurrency, callback);
  }
}
