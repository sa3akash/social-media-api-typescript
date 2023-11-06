// external libraries
import express, { Express } from 'express';

// custom files
import { SetupServer } from '@root/setupServer';
import dbConnection from '@root/setupDatabase';
import { config } from '@root/config';

/**
 *
 * main server
 *
 */

class MainApplication {
  public initialize(): void {
    this.loadConfig();
    dbConnection();
    const app: Express = express();
    const server = new SetupServer(app);
    server.start();
  }

  private loadConfig(): void {
    config.validateConfig();
  }
}

const application: MainApplication = new MainApplication();
application.initialize();
