import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { GoLive } from '../models/GoLive';
import { Utils } from '@globals/helpers/utils';
import { liveQueue } from '@services/queues/live.queue';
import axios from 'axios';

export class GoLiveController {
  public async authenticateStream(req: Request, res: Response) {
    const { name } = req.body;

    if (!name) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Key is required.' });
    }

    const doc = await GoLive.findOne({ streamKey: name });

    if (!doc) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Go Live stream not found.' });
    }

    res.status(HTTP_STATUS.OK).json('OK');
  }
  public async start(req: Request, res: Response) {
    const { title, description, privacy } = req.body;
    if (!title || !description || !privacy) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'All are required.' });
    }

    const doc = await GoLive.findOne({ authId: req.currentUser!.id });

    const response = await axios.get('http://localhost:8080/stats');
    const streamData = response.data;
    const isStreamActive = streamData?.includes(doc?.streamKey);

    if (!isStreamActive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'stream are not ready.' });
    }

    if (doc?.isLive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'You are already live streaming.' });
    }

    const data = {
      title,
      description,
      privacy,
      authId: req.currentUser!.id
    };

    liveQueue.addPostJob('goLive', JSON.stringify(data));

    res.status(HTTP_STATUS.OK).json({ message: 'live start' });
  }
  public async clean(req: Request, res: Response) {
    console.log(req.body);

    res.status(HTTP_STATUS.OK).json({ message: 'live start' });
  }

  public async streamRecordEnd(req: Request, res: Response) {
    const { name, path } = req.body;

    const originalPath = `/uploads/recorded/${path.split('/').pop()}`;

    // save data in db
    // const stremData = await GoLive.findOne({ streamKey: name });

    // if (!stremData?.isLive) {
    //   fileUtils.deleteFile(originalPath);
    //   res.status(200).send('ok');
    //   return;
    // }

    // save data in db
    await GoLive.updateOne(
      { streamKey: name, isLive:true },
      {
        $set: {
          isLive: false,
          title: '',
          description: '',
          streamKey: Utils.generateStreamKey()
        }
      }
    );

    liveQueue.recordEnd('recordEnd', JSON.stringify({ name, originalPath }));

    res.status(HTTP_STATUS.OK).json('OK');
  }
  public async streamStop(req: Request, res: Response) {
    const data = await GoLive.findOne({ authId: req.currentUser?.id });
    await axios.post(`http://localhost:8080/control/drop/publisher?app=live&name=${data?.streamKey}`);
    res.status(HTTP_STATUS.OK).send('OK');
  }
  public async getStreamKey(req: Request, res: Response) {
    const data = await GoLive.findOne({ authId: req.currentUser?.id });

    res.status(HTTP_STATUS.OK).json(data);
  }
  public async reSet(req: Request, res: Response) {
    const data = await GoLive.findOneAndUpdate(
      { authId: req.currentUser?.id, isLive: false },
      {
        $set: {
          streamKey: Utils.generateStreamKey(),
          isLive: false
        }
      },
      { new: true }
    );

    res.status(HTTP_STATUS.OK).json(data);
  }
}
