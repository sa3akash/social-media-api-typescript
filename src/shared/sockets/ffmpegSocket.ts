import { Socket } from 'socket.io';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { GoLive } from '@root/features/goLive/models/GoLive';
import { config } from '@root/config';
import { liveQueue } from '@services/queues/live.queue';

const log = config.createLogger('ffmpeg socket for go live using camera');



export const ffmpegSocket = (socket: Socket) => {
  if (config.NODE_ENV === 'development') {
    ffmpeg.setFfmpegPath(`${global.root}/uploads/bin/ffmpeg.exe`);
  }

  const authId = socket.handshake.query.authId as string;
  let command: ffmpeg.FfmpegCommand | null = null;
  let inputStream: PassThrough | null = null;

  socket.on('start-live', async ({ title, description, privacy }) => {
    const data = { title, description, privacy, authId };
    const doc = await GoLive.findOne({ authId });

    if (!doc) {
      socket.emit('live-error', 'Could not find the stream key');
      return;
    }
    if (doc.isLive) {
      socket.emit('live-error', 'You are already live');
      return;
    }

    liveQueue.addPostJob('goLive', JSON.stringify(data));
  });

  socket.on('go-stream', async (stream: Uint8Array) => {
    const doc = await GoLive.findOne({ authId });

    if (!doc) {
      socket.emit('live-error', 'Could not find the stream key');
      return;
    }

    const streamKey = doc.streamKey;
    if (!streamKey) {
      socket.emit('live-error', 'Missing stream key.');
      return;
    }

    if (!inputStream) {
      inputStream = new PassThrough();
      inputStream.setMaxListeners(0); // Allow unlimited listeners
    }

    if (!command) {
      command = ffmpeg()
        .input(inputStream)
        .inputFormat('webm')
        .videoCodec('libx264')
        .audioCodec('aac')
        .format('flv')
        .output(`rtmp://localhost:1935/live/${streamKey}`)
        .outputOptions(['-preset veryfast', '-b:v 2500k', '-b:a 128k', '-g 30', '-r 30'])
        .on('start', () => log.info('FFmpeg process started'))
        .on('error', (err) => {
          if (!err.message.includes('SIGINT')) {
            log.error('FFmpeg error:', err.message);
          }
          cleanupFFmpeg();
        })
        .on('end', (code, signal) => {
          log.info(`FFmpeg exited with code ${code}, signal: ${signal}`);
          cleanupFFmpeg();
        });

      command.run();
    }

    if (inputStream.writable) {
      inputStream.write(Buffer.from(stream));
    } else {
      log.error('Stream is not writable or does not exist');
    }

    // Remove previous error listeners to prevent memory leaks
    inputStream.removeAllListeners('error');

    // Add a new error listener
    inputStream.on('error', (err) => {
      log.error('Input stream error:', err.message);
    });
  });

  // Stop streaming
  socket.on('stop-stream', () => {
    log.info('Stopping stream...');
    cleanupFFmpeg();
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    log.info('Socket disconnected. Cleaning up resources...');
    cleanupFFmpeg();
  });

  // Cleanup function for FFmpeg process & input stream
  const cleanupFFmpeg = () => {
    if (command) {
      log.info('Stopping FFmpeg process...');

      // Gracefully stop the FFmpeg process
      command.kill('SIGINT');
      command = null;
    }

    if (inputStream) {
      try {
        inputStream.end();
        inputStream.destroy();
        inputStream.removeAllListeners();
        log.info('Input stream closed and destroyed');
      } catch (err) {
        log.error('Error closing input stream:', err);
      }
      inputStream = null;
    }
  };
};




// export const ffmpegSocket = (socket: Socket) => {
//   if (config.NODE_ENV === 'development') {
//     ffmpeg.setFfmpegPath(`${global.root}/uploads/bin/ffmpeg.exe`);
//   }

//   const authId = socket.handshake.query.authId as string;
//   let command: ffmpeg.FfmpegCommand | null = null;
//   const inputStream = new PassThrough();

//   socket.on('start-live', async ({ title, description, privacy }) => {
//     const data = {
//       title,
//       description,
//       privacy,
//       authId
//     };

//     const doc = await GoLive.findOne({ authId });
//     if (!doc) {
//       socket.emit('live-error', 'Could not find the stream key');
//       return;
//     }
//     if (doc.isLive) {
//       socket.emit('live-error', 'your already in live');
//       return;
//     }

//     liveQueue.addPostJob('goLive', JSON.stringify(data));

//     command = ffmpeg()
//       .input(inputStream)
//       .inputFormat('webm') // Match the format of the incoming stream
//       .videoCodec('libx264')
//       .audioCodec('aac')
//       .format('flv')
//       .output(`rtmp://localhost:1935/live/${doc.streamKey}`) // Replace with your RTMP server URL
//       .outputOptions([
//         '-preset veryfast',
//         '-b:v 2500k', // Video bitrate
//         '-b:a 128k', // Audio bitrate
//         '-g 30', // Keyframe interval
//         '-r 30', // Frame rate
//         '-vf scale=1280:720', // Resize video
//         '-strict experimental',
//         '-f flv'
//       ])
//       .on('start', () => {
//         console.log('FFmpeg process started');
//       })
//       .on('error', (err) => {
//         console.error('FFmpeg error:', err.message);
//         command = null;
//       })
//       .on('end', () => {
//         console.log('FFmpeg process ended');
//         command = null;
//       });

//     command.run();
//   });

//   socket.on('go-stream', async (stream: Uint8Array) => {
//     if (inputStream.writable) {
//       inputStream.write(Buffer.from(stream));
//     }
//   });

//   socket.on('stop-stream', () => {
//     if (command) {
//       command.on('end', () => {
//         log.info('FFmpeg process ended gracefully after stop-stream');
//         command = null; // Reset command reference
//       });
//       command.kill('SIGINT'); // Gracefully stop the FFmpeg process
//       log.info('Stream stopped');
//     }
//   });

//   socket.on('disconnect', () => {
//     // Clean up on disconnect
//     if (command) {
//       command.kill('SIGINT'); // Ensure the FFmpeg process stops
//       command = null; // Reset command reference
//     }
//   });
// };

// ==============================================================================