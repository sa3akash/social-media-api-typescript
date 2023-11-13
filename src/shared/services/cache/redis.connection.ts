import Logger from 'bunyan';
import { config } from '@root/config';
import { BaseCache } from '@services/cache/base.cache';

const log: Logger = config.createLogger('redis-connection');

class RedisConnection extends BaseCache {
  constructor() {
    super('redis-connection');
  }

  async connection() {
    try {
      await this.client.connect();
      return this.client;
    } catch (err) {
      log.error(err);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
