import fs from 'node:fs';
import ffmpeg from 'fluent-ffmpeg';
import { IFiles } from '@post/interfaces/post.interfaces';
import path from 'node:path';
import { config } from '@root/config';
const log = config.createLogger('fileUtils');

class FileUtils {
  public deleteFile(pathDest: string) {
    const url = path.join(global.root, pathDest);
    fs.unlinkSync(url);
  }

  public async deleteDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.promises.readdir(dirPath);

      // Iterate over the files and folders in the directory
      await Promise.all(
        files.map(async (file) => {
          const currentPath = path.join(dirPath, file);
          const stat = await fs.promises.stat(currentPath);

          if (stat.isDirectory()) {
            // Recursively delete subdirectory
            await this.deleteDirectory(currentPath);
          } else {
            // Delete the file
            await fs.promises.unlink(currentPath);
          }
        })
      );

      // Remove the directory itself
      await fs.promises.rmdir(dirPath);
    } catch (error) {
      console.error(`Error while deleting directory: ${dirPath}`, error);
      throw error; // Re-throw the error after logging it
    }
  }

  private ready() {
    if (config.NODE_ENV === 'development') {
      ffmpeg.setFfmpegPath(`${global.root}/uploads/bin/ffmpeg.exe`);
      ffmpeg.setFfprobePath(`${global.root}/uploads/bin/ffprobe.exe`);
    }
  }

  public async getVideoMetadata(pathURl: string): Promise<ffmpeg.FfprobeData> {
    this.ready();

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
      display_aspect_ratio: streams.length > 0 ? `${streams[0].display_aspect_ratio}` : ''
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

  public makeFlvToMp4(srcPath: string, destPath: string) {
    this.ready();
    return new Promise((resolve) => {
      const srcUrl = path.join(global.root, srcPath);
      const destUrl = path.join(global.root, destPath);

      if (!fs.existsSync(destUrl)) {
        fs.mkdirSync(path.dirname(destUrl), { recursive: true });
      }
      // Use fluent-ffmpeg to convert FLV to MP4
      ffmpeg(srcUrl)
        .output(destUrl)
        .audioCodec('aac') // Set audio codec
        .videoCodec('libx264') // Set video codec
        .outputOptions('-movflags', '+faststart') // Optimize for streaming
        .on('end', () => {
          log.info('Conversion finished.');
          resolve('Conversion finished.');
        })
        .on('error', (err) => {
          log.error('Error converting file:', err?.message);
        })
        .run();
    });
  }
}

export const fileUtils = new FileUtils();
