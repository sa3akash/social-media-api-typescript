import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

export class FFMPEG_Utils {
  private videoPath: string;

  constructor(videoUrl: string) {
    this.videoPath = videoUrl;
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    // Set path for ffprobe (same as ffmpeg)
    ffmpeg.setFfprobePath(ffmpegInstaller.path);
  }

  public async getMetadata(): Promise<ffmpeg.FfprobeData> {
    return await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(this.videoPath, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata);
      });
    });
  }
}
