import { BadRequestError, ServerError } from '@globals/helpers/errorHandler';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { IFiles } from '@post/interfaces/post.interfaces';

export class UploadFileController {
  public async upload(req: Request, res: Response) {
    const { name, currentChunkIndex, totalChunks, size, type } = req.query as {
      name: string;
      currentChunkIndex: string;
      totalChunks: string;
      size: string;
      type: string;
    };

    if (!name || !currentChunkIndex || !totalChunks || !req.body || !type || !size) {
      throw new BadRequestError('Missing required query parameters');
    }

    const UPLOAD_DIR = `${root}/uploads/stream`;

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // const firstChunk = parseInt(currentChunkIndex) === 0;
    const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
    const ext = name.split('.').pop();

    const tmpFilename =
      'file_' +
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
        // const generateFileName =
        //   'final_' +
        //   crypto
        //     .createHash('md5')
        //     .update(name + req.ip)
        //     .digest('hex') +
        //   '.' +
        //   ext;

        // const finalFilePath = path.join(UPLOAD_DIR, generateFileName);

        // fileSystem.moveFile(filePath, finalFilePath); // move file

        // const saveFile = await UploadModel.create({
        //   size: size,
        //   type: type,
        //   url: `/uploads/${generateFileName}`,
        //   name: name
        // });


        const readyObject: IFiles = {
          size: Number(size),
          mimetype: type,
          url: `/stream/${tmpFilename}`,
          name
        };

        res.status(HTTP_STATUS.OK).json(readyObject);
      } else {
        res.status(HTTP_STATUS.OK).json('ok');
      }
    });

    writeStream.on('error', () => {
      throw new ServerError('Internal Server Error');
    });
  }

  public async streams(req: Request, res: Response) {
    const filePath = path.join(`${global.root}`, '/uploads/stream', req.params.url);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Determine the Content-Type based on the file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.flv' ? 'video/x-flv' : 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType // Set dynamically
      });

      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType // Set dynamically
      });
      fs.createReadStream(filePath).pipe(res);
    }
  }
}
