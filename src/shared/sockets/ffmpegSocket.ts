import { Socket } from 'socket.io';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { GoLive } from '@root/features/goLive/models/GoLive';
import { config } from '@root/config';
import { liveQueue } from '@services/queues/live.queue';

const log = config.createLogger('ffmpeg socket for go live using camera');

export const ffmpegSocket = (socket: Socket) => {
  ffmpeg.setFfmpegPath(`${global.root}/uploads/bin/ffmpeg.exe`); // Replace with actual path

  const authId = socket.handshake.query.authId as string;

  socket.on('start-live', async ({ title, description, privacy }) => {
    const data = {
      title,
      description,
      privacy,
      authId
    };

    const doc = await GoLive.findOne({ authId });
    if (!doc) {
      socket.emit('live-error', 'Could not find the stream key');
      return;
    }
    if (doc.isLive) {
      socket.emit('live-error', 'your already in live');
      return;
    }

    liveQueue.addPostJob('goLive', JSON.stringify(data));
  });

  let command: ffmpeg.FfmpegCommand | null = null;
  const inputStream = new PassThrough();

  socket.on('go-stream', async (stream: Uint8Array) => {
    const doc = await GoLive.findOne({ authId });

    if (!doc) {
      socket.emit('live-error', 'Could not find the stream key');
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
  });

  socket.on('stop-stream', () => {
    if (command) {
      command.on('end', () => {
        log.info('FFmpeg process ended gracefully after stop-stream');
        command = null; // Reset command reference
      });
      command.kill('SIGINT'); // Gracefully stop the FFmpeg process
      log.info('Stream stopped');
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

// ===============================

// import { Socket } from 'socket.io';
// import ffmpeg from 'fluent-ffmpeg';
// import { PassThrough } from 'stream';
// import { GoLive } from '@root/features/goLive/models/GoLive';
// import { config } from '@root/config';
// import { liveQueue } from '@services/queues/live.queue';

// const log = config.createLogger('FFmpeg socket for go live using camera');

// // Map to manage multiple user streams
// const activeStreams = new Map<string, { command: ffmpeg.FfmpegCommand | null, inputStream: PassThrough | null }>();

// export const ffmpegSocket = (socket: Socket) => {
//   ffmpeg.setFfmpegPath(`${global.root}/bin/ffmpeg.exe`); // Replace with actual path

//   socket.on('go-stream', async () => {
//     const authId = socket.handshake.query.authId as string;

//     if (activeStreams.has(authId)) {
//       socket.emit('live-error', 'Stream already active');
//       return;
//     }

//     const doc = await GoLive.findOne({ authId });
//     if (!doc) {
//       socket.emit('live-error', 'Could not find the stream key');
//       return;
//     }

//     const streamKey = doc.streamKey;
//     const inputStream = new PassThrough();

//     // Create a new FFmpeg command for this stream
//     const command = ffmpeg()
//       .input(inputStream) // Use the input stream
//       .inputFormat('webm') // Format from the camera
//       .videoCodec('libx264')
//       .audioCodec('aac')
//       .format('flv') // RTMP-compatible format
//       .output(`rtmp://localhost:2323/live/${streamKey}`) // Replace with your RTMP server
//       .outputOptions([
//         '-preset veryfast',
//         '-b:v 2500k', // Video bitrate
//         '-b:a 128k', // Audio bitrate
//         '-g 30', // Keyframe interval
//         '-r 30' // Frame rate
//       ])
//       .on('start', () => {
//         log.info(`FFmpeg process started for authId: ${authId}`);
//       })
//       .on('error', (err) => {
//         log.error(`FFmpeg error for authId: ${authId}:`, err.message);
//         cleanupStream(authId); // Ensure cleanup on error
//       })
//       .on('end', () => {
//         log.info(`FFmpeg process ended for authId: ${authId}`);
//         cleanupStream(authId); // Cleanup on process end
//       });

//     // Save the stream to the active streams map
//     activeStreams.set(authId, { command, inputStream });

//     // Start the FFmpeg process
//     command.run();

//     // Handle incoming video stream data
//     socket.on('stream-data', (data: Uint8Array) => {
//       const streamEntry = activeStreams.get(authId);
//       if (streamEntry) {
//         streamEntry.inputStream?.write(Buffer.from(data)); // Write stream data to input stream
//       }
//     });
//   });

//   socket.on('stop-stream', () => {
//     const authId = socket.handshake.query.authId as string;
//     liveQueue.stopStream('stopStream', `${authId}`);
//     cleanupStream(authId);
//     log.info(`Stream stopped for authId: ${authId}`);
//   });

//   socket.on('disconnect', () => {
//     const authId = socket.handshake.query.authId as string;
//     liveQueue.stopStream('stopStream', `${authId}`);
//     cleanupStream(authId);
//     log.info(`Disconnected, cleanup stream for authId: ${authId}`);
//   });
// };

// // Cleanup function to stop streams and remove from activeStreams
// function cleanupStream(authId: string) {
//   const streamEntry = activeStreams.get(authId);
//   if (streamEntry) {
//     const { command, inputStream } = streamEntry;
//     try {
//       // Gracefully stop FFmpeg process
//       if (command) {
//         log.info(`Killing FFmpeg process for authId: ${authId}`);
//         command.kill('SIGINT'); // Stop FFmpeg process gracefully

//       }
//       // Destroy the input stream to ensure cleanup
//       if (inputStream) {
//         inputStream.destroy();
//       }
//       activeStreams.delete(authId);
//     } catch (err) {
//       if (command) {
//         log.info(`Killing FFmpeg process for authId: ${authId}`);
//         command.kill('SIGINT'); // Stop FFmpeg process gracefully

//       }
//       // Destroy the input stream to ensure cleanup
//       if (inputStream) {
//         inputStream.destroy();
//       }
//       activeStreams.delete(authId);
//       log.error(`Error cleaning up stream for authId: ${authId}:`, err);
//     }
//   }
// }
