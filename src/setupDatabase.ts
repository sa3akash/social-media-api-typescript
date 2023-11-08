// external libraries
import mongoose from 'mongoose';
import { config } from '@root/config';
import { redisConnection } from '@services/cache/redis.connection';

const log = config.createLogger('database connection');

export default () => {
  const connect = () => {
    mongoose
      .connect('mongodb://localhost:27017/social')
      .then(() => {
        log.info('DB SUCCESSFULLY CONNECTED');
        redisConnection.connection();
      })
      .catch((err) => {
        log.error(err.message);
        process.exit(1);
      });
  };
  connect();
  mongoose.connection.on('disconnected', connect);
};
