import { DoneCallback, Job } from 'bull';
import { mailTransport } from '@services/emails/mail.transport';

class EmailWorker {
  async addNotificationEmail(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { receiverEmail, template, subject } = job.data;
      // save data in db
      await mailTransport.sendEmail(receiverEmail, subject, template);
      // add method to save data in db
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const emailWorker: EmailWorker = new EmailWorker();
