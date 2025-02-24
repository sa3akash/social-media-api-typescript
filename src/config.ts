/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config();

class Config {
  public DATABASE_URL: string | undefined;
  public JWT_SEC: string | undefined;
  public NODE_ENV: string | undefined;
  public SECRET_KEY_1: string | undefined;
  public SECRET_KEY_2: string | undefined;
  public CLIENT_URL: string | undefined;
  public PORT: number | undefined;
  public REDIS_URL: string | undefined;

  public SENDGRID_API_KEY: string | undefined;
  public SENDGRID_SENDER: string | undefined;
  public SENDER_EMAIL_PASSWORD: string | undefined;
  public SENDER_EMAIL: string | undefined;

  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL || 'mongodb';
    this.JWT_SEC = process.env.JWT_SEC;
    this.NODE_ENV = process.env.NODE_ENV;
    this.SECRET_KEY_1 = process.env.SECRET_KEY_1;
    this.SECRET_KEY_2 = process.env.SECRET_KEY_2;
    this.CLIENT_URL = process.env.CLIENT_URL;
    this.PORT = Number(process.env.PORT) || 5000;
    this.REDIS_URL = process.env.REDIS_URL || 'redis';
    this.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    this.SENDGRID_SENDER = process.env.SENDGRID_SENDER;
    this.SENDER_EMAIL = process.env.SENDER_EMAIL;
    this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD;
  }

  public validateConfig(): void {
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined || value === null) {
        throw new Error(`${key} env is not defined.`);
      }
    }
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({
      name: name,
      level: 'debug'
    });
  }
}

export const config: Config = new Config();
