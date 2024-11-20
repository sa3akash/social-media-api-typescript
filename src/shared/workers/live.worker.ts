import { Utils } from '@globals/helpers/utils';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { PostModel } from '@post/models/post.models';
import { GoLive } from '@root/features/goLive/models/GoLive';
import { postCache } from '@services/cache/post.cache';
import { userCache } from '@services/cache/user.cache';
import { postServices } from '@services/db/post.services';
import { socketIoPostObject } from '@sockets/post.sockets';
import { DoneCallback, Job } from 'bull';
import { ObjectId } from 'mongodb';
import { fileUtils } from '@globals/helpers/fileUtils';

class LiveWorker {
  async createLive(job: Job, done: DoneCallback): Promise<void> {
    try {
      const postObjectId: ObjectId = new ObjectId();

      // save data in db
      const data = JSON.parse(job.data);

      const authUser = await userCache.getUserByIdFromCache(data.authId);

      const doc = await GoLive.findOneAndUpdate(
        { authId: data.authId },
        {
          $set: {
            isLive: true,
            title: data.title,
            description: data.description,
            privacy: data.privacy
          }
        },
        {
          new: true
        }
      );

      const postCreated = {
        _id: postObjectId,
        authId: authUser.authId,
        uId: authUser.uId,
        post: doc?.title,
        bgColor: '',
        commentsCount: 0,
        files: [],
        feelings: '',
        description: doc?.description,
        gifUrl: '',
        privacy: doc?.privacy || 'Public',
        live: true,
        liveUrl: doc?.streamKey,
        createdAt: new Date(),
        reactions: {
          like: 0,
          love: 0,
          care: 0,
          happy: 0,
          wow: 0,
          sad: 0,
          angry: 0
        }
      } as unknown as IPostDocument;

      // save post in cache
      await postCache.savePostToCache(postCreated);
      await postServices.addPostInDB(postCreated);

      // add method to save data in db

      socketIoPostObject.emit('add-post', {
        ...postCreated,
        creator: {
          authId: `${authUser._id}`,
          uId: `${authUser.uId}`,
          coverPicture: `${authUser.coverPicture}`,
          profilePicture: `${authUser.profilePicture}`,
          name: authUser.name,
          username: `${authUser.username}`,
          email: `${authUser.email}`,
          avatarColor: `${authUser.avatarColor}`,
          createdAt: `${authUser.createdAt}`
        }
      });

      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }

  async stopSteam(job: Job, done: DoneCallback): Promise<void> {
    try {
      // save data in db
      await GoLive.updateOne(
        { authId: job.data },
        {
          $set: {
            isLive: false,
            title: '',
            description: '',
            streamKey: Utils.generateStreamKey()
          }
        },
        { new: true }
      );
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
  async recordEnd(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { name, originalPath } = JSON.parse(job.data);

      const post = await PostModel.findOne({ live: true, liveUrl: name });

      if (post) {
        const destPath = `/uploads/live/${post._id}-${post.authId}-${Date.now()}.${originalPath.split('.').pop()}`;
        const videoMetadata = await fileUtils.getVideoMetadata(originalPath);

        fileUtils.moveFile(originalPath, destPath);
        const getFile = fileUtils.getIFileMetaData(videoMetadata, destPath);

        post.files.push(getFile);
        post.live = false;
        post.liveUrl = '';

        const newValue = await post.save();
        await postCache.updatePostFromCache(newValue);

      } else {
        fileUtils.deleteFile(originalPath);
      }

      job.progress(100);
      done(null, job.data);
    } catch (err) {
      done(err as Error);
    }
  }
}

export const liveWorker: LiveWorker = new LiveWorker();
