import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { postSchema } from '@post/schemas/post.schemas';
import { postCache } from '@services/cache/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { socketIoPostObject } from '@sockets/post.sockets';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

export class CreatePost {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const postObjectId: ObjectId = new ObjectId();

    const createdPostObject: IPostDocument = CreatePost.prototype.createdPost(req, postObjectId);
    // emit post all user using socket io
    socketIoPostObject.emit('add-post', {
      ...createdPostObject,
      creator: {
        authId: `${req.currentUser?.id}`,
        uId: `${req.currentUser?.id}`,
        coverPicture: `${req.currentUser?.coverPicture}`,
        profilePicture: `${req.currentUser?.profilePicture}`,
        name: req.currentUser?.name,
        username: `${req.currentUser?.username}`,
        email: `${req.currentUser?.email}`,
        avatarColor: `${req.currentUser?.avatarColor}`,
        createdAt: `${req.currentUser?.createdAt}`
      }
    });
    // save post in cache
    await postCache.savePostToCache(createdPostObject);
    // add post in db
    // const createdPostDBObject: IPostDocument = CreatePost.prototype.createPostInDB(req, postObjectId);
    postQueue.addPostJob('addPostInDBQueue', createdPostObject);

    res.status(HTTP_STATUS.CREATED).json({ message: 'Post created successfully.' });
  }

  //
  // created new post for return and cache
  //
  private createdPost(req: Request, postId: ObjectId): IPostDocument {
    const { post, bgColor, privacy, feelings, gifUrl } = req.body;

    return {
      _id: postId,
      authId: req.currentUser?.id,
      uId: req.currentUser?.uId,
      post,
      bgColor: bgColor || '',
      commentsCount: 0,
      files: req.files ? req.files : [],
      feelings: feelings || '',
      gifUrl: gifUrl || '',
      privacy: privacy || 'Public',
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
  }
}
