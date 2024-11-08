import { BadRequestError, ServerError } from '@globals/helpers/errorHandler';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { UploadModel } from '@root/features/upload/UploadModel';
import { fileSystem } from '@services/ffmpeg/fileSystem';


export class UploadFileController {
  public async upload(req: Request, res: Response) {
    const { name, currentChunkIndex, totalChunks, size, type } = req.query as {
      name: string;
      currentChunkIndex: string;
      totalChunks: string;
      size: string;
      type: string;
    };

    if (!name || !currentChunkIndex || !totalChunks || !req.body) {
      throw new BadRequestError('Missing required query parameters');
    }

    const UPLOAD_DIR = `${root}/uploads`;

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // const firstChunk = parseInt(currentChunkIndex) === 0;
    const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
    const ext = name.split('.').pop();

    const tmpFilename =
      'tmp_' +
      crypto
        .createHash('md5')
        .update(name + req.ip)
        .digest('hex') +
      '.' +
      ext;

    const filePath = path.join(UPLOAD_DIR, tmpFilename);

    const data = req.body.toString().split(',')[1];
    const buffer = Buffer.from(data, 'base64');

    // Use stream to write chunks to the file
    const writeStream = fs.createWriteStream(filePath, { flags: 'a' });
    writeStream.write(buffer);
    writeStream.end();

    writeStream.on('finish', async () => {
      if (lastChunk) {
        const generateFileName =
          'final_' +
          crypto
            .createHash('md5')
            .update(name + req.ip)
            .digest('hex') +
          '.' +
          ext;

        const finalFilePath = path.join(UPLOAD_DIR, generateFileName);

        fileSystem.moveFile(filePath, finalFilePath); // move file

        const saveFile = await UploadModel.create({
          size: size,
          type: type,
          url: `/uploads/${generateFileName}`,
          name: name
        });

      

        res.status(HTTP_STATUS.OK).json(saveFile);
      } else {
        res.status(HTTP_STATUS.OK).json('ok');
      }
    });

    writeStream.on('error', () => {
      throw new ServerError('Internal Server Error');
    });
  }
}
