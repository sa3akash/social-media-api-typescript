// external libraries
import express, { Express } from 'express';
// import cluster from 'cluster';
import path from 'node:path';

// custom files
import { SetupServer } from '@root/setupServer';
import dbConnection from '@root/setupDatabase';
import { config } from '@root/config';

/**
 *
 * main server
 *
 */

declare global {
  // eslint-disable-next-line no-var
  var root: string;
}

class MainApplication {
  public initialize(): void {
    this.loadConfig();
    dbConnection();
    const app: Express = express();

    global.root = path.resolve(__dirname);

    const server = new SetupServer(app);
    server.start();
  }

  private loadConfig(): void {
    config.validateConfig();
  }
}

const application: MainApplication = new MainApplication();
application.initialize();

// if (cluster.isPrimary) {
//   for (let i = 0; i < 4; i++) {
//     cluster.fork();
//   }
// } else {
//   application.initialize();
// }
