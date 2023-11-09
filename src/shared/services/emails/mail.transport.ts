import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import sendGridMail from '@sendgrid/mail';
// custom files
import { config } from '@root/config';
import { BadRequestError } from '@globals/helpers/errorHandler';

const log = config.createLogger('mailer-transport');

interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

sendGridMail.setApiKey(config.SENDGRID_API_KEY!);

class MailTransport {
  public async sendEmail(receiverEmail: string, subject: string, body: string): Promise<void> {
    const mailOptions: IMailOptions = {
      from: '"SA2 🔥" <sa2@social.com>',
      to: receiverEmail,
      subject: subject,
      html: body
    };

    if (config.NODE_ENV === 'test' || config.NODE_ENV === 'development') {
      await this.developmentEmailSender(mailOptions);
    } else {
      await this.productionEmailSender(mailOptions);
    }
  }

  private async developmentEmailSender(mailOptions: IMailOptions): Promise<void> {
    const transporter: Mail = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: config.NODE_ENV !== 'development',
      auth: {
        user: config.SENDER_EMAIL,
        pass: config.SENDER_EMAIL_PASSWORD
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      throw new BadRequestError('Mail transport error');
    }
  }

  private async productionEmailSender(mailOptions: IMailOptions): Promise<void> {
    try {
      await sendGridMail.send(mailOptions);
    } catch (err) {
      log.error('Mail transport error', err);
    }
  }
}

export const mailTransport: MailTransport = new MailTransport();
