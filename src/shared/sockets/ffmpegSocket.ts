import { Socket } from 'socket.io';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { GoLive } from '@root/features/goLive/models/GoLive';
import { config } from '@root/config';
import { liveQueue } from '@services/queues/live.queue';

const log = config.createLogger('ffmpeg socket for go live using camera');

export const ffmpegSocket = (socket: Socket) => {
  ffmpeg.setFfmpegPath(`${global.root}/bin/ffmpeg.exe`); // Replace with actual path

  let command: ffmpeg.FfmpegCommand | null = null;
  const inputStream = new PassThrough();

  socket.on(
    'go-stream',
    async (stream: Uint8Array) => {
      const authId = socket.handshake.query.authId as string;

      const doc = await GoLive.findOne({ authId });

      if (!doc) {
        socket.emit('live-error', 'Could not find the stream key');
        if(command){
          command.kill('SIGINT');
        }
        return;
      }

      const streamKey = doc.streamKey;

      if (!command) {
        command = ffmpeg()
          .input(inputStream) // Use the input stream from the Writable
          .inputFormat('webm') // Ensure this matches the format being sent
          .videoCodec('libx264') // Use a video codec for encoding
          .audioCodec('aac') // Use an audio codec for encoding
          .format('flv') // The format that is compatible with RTMP
          .output(`rtmp://localhost:2323/live/${streamKey}`) // Output to RTMP server
          .outputOptions([
            '-preset veryfast',
            '-b:v 2500k', // Video bitrate
            '-b:a 128k', // Audio bitrate
            '-g 30', // Keyframe interval
            '-r 30' // Frame rate
            // "-report" // This will create a report file
          ])
          .on('start', () => {
            log.info('FFmpeg process started');
          })
          .on('error', (err) => {
            // Only log the error if it is not from stopping the stream
            if (!err.message.includes('SIGINT')) {
              log.error('FFmpeg error:', err.message);
            }
            command = null; // Reset command on error
          })
          .on('end', () => {
            log.info('FFmpeg process ended');
            command = null; // Reset command when finished
          });

        // Start the FFmpeg process
        command.run();
      }

      // Write incoming data to the FFmpeg input stream
      inputStream.write(Buffer.from(stream));
    }
  );

  socket.on('stop-stream', () => {
    const authId = socket.handshake.query.authId as string;

    if (command) {
      command.on('end', () => {
        log.info('FFmpeg process ended gracefully after stop-stream');
        command = null; // Reset command reference
      });
      liveQueue.stopStream('stopStream', `${authId}`);

      command.kill('SIGINT'); // Gracefully stop the FFmpeg process
      // console.log("Stream stopped");
    }
  });

  socket.on('disconnect', () => {
    // Clean up on disconnect
    if (command) {
      command.kill('SIGINT'); // Ensure the FFmpeg process stops
      command = null; // Reset command reference
    }
  });
};
