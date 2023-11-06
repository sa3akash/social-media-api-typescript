// external libraries
import mongoose from 'mongoose';
import { config } from '@root/config';

const log = config.createLogger('database connection');

export default () => {
  const connect = () => {
    mongoose
      .connect(config.DATABASE_URL as string)
      .then(() => {
        log.info('DB SUCCESSFULLY CONNECTED');
      })
      .catch((err) => {
        log.error(err.message);
        process.exit(1);
      });
  };
  connect();
  mongoose.connection.on('disconnected', connect);
};
