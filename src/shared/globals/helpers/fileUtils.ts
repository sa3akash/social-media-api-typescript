import fs from 'node:fs';
import ffmpeg from 'fluent-ffmpeg';
import { IFiles } from '@post/interfaces/post.interfaces';
import path from 'node:path';

class FileUtils {
  public deleteFile(pathDest: string) {
    const url = path.join(global.root, pathDest);
    fs.unlinkSync(url);
  }

  public async getVideoMetadata(pathURl: string): Promise<ffmpeg.FfprobeData> {
    ffmpeg.setFfmpegPath(`${global.root}/uploads/bin/ffmpeg.exe`);
    ffmpeg.setFfprobePath(`${global.root}/uploads/bin/ffprobe.exe`);

    const videoUrl = path.join(global.root, pathURl);

    return await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoUrl, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }
  public getIFileMetaData(videoMetadata: ffmpeg.FfprobeData, originalPath: string): IFiles {
    const format = videoMetadata.format;
    const streams = videoMetadata.streams;
    const filesData: IFiles = {
      mimetype: format.format_name || '',
      size: format.size || 0,
      url: originalPath,
      name: originalPath.split('/').pop() || '',
      duration: format.duration || 0,
      resulation: streams.length > 0 ? `${streams[0].width}x${streams[0].height}` : '',
      display_aspect_ratio: streams.length > 0 ? `${streams[0].display_aspect_ratio}` : '',
    };
    return filesData;
  }
  public moveFile(srcPath: string, destPath: string) {

    const srcUrl = path.join(global.root, srcPath);
    const destUrl = path.join(global.root, destPath);

    // Ensure the destination directory exists
    if (!fs.existsSync(destUrl)) {
      fs.mkdirSync(path.dirname(destUrl), { recursive: true });
    }
    fs.copyFileSync(srcUrl, destUrl);
    fs.unlinkSync(srcUrl);
  }
}

export const fileUtils = new FileUtils();
