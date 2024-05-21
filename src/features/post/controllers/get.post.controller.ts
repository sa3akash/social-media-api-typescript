import { BadRequestError } from '@globals/helpers/errorHandler';
import { IPostDocument } from '@post/interfaces/post.interfaces';
import { postCache } from '@services/cache/post.cache';
import { postServices } from '@services/db/post.services';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const PAGE_SIZE = 10;

export class GetPostController {
  public async getAll(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const newSkip: number = skip === 0 ? skip : skip + 1;
    // get all
    const allPostsCache = await postCache.getPostFromCache('post', newSkip, limit);
    const totalPostsCache = await postCache.getTotalNumberOfPostFromCache();

    const allPosts = allPostsCache.length > 0 ? allPostsCache : await postServices.getPostsFromDB({}, skip, limit, { createdAt: -1 });
    const numberOfPosts = totalPostsCache ? totalPostsCache : await postServices.postCountDB({});
    // response
    res.status(HTTP_STATUS.OK).json({
      message: 'Get all posts successfully.',
      posts: allPosts,
      currentPage: Number(page),
      numberOfPages: Math.ceil(numberOfPosts / PAGE_SIZE)
    });
  }
  public async getAllByAuthId(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const authId = req.params.authId as string;

    const newSkip: number = skip === 0 ? skip : skip + 1;
    // get all
    const allPostsCache = await postCache.getPostFromCacheBasedOnUserId('post', newSkip, limit, authId);
    const totalPostsCache = await postCache.getTotalNumberOfPostFromCache();

    const allPosts =
      allPostsCache.length > 0 ? allPostsCache : await postServices.getPostsFromDBByAuthId({}, skip, limit, { createdAt: -1 }, authId);
    const numberOfPosts = totalPostsCache ? totalPostsCache : await postServices.postCountDB({});
    // response
    res.status(HTTP_STATUS.OK).json({
      message: 'Get all posts successfully.',
      posts: allPosts,
      currentPage: Number(page),
      numberOfPages: Math.ceil(numberOfPosts / PAGE_SIZE)
    });
  }
  /*
   *
   * get post with images
   *
   */
  public async getAllPostWithImage(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const newSkip: number = skip === 0 ? skip : skip + 1;
    // get all
    const allPostsImagesCache = await postCache.getPostFromCacheImages('post', newSkip, limit);
    const numberOfPosts = await postServices.postCountDB({ file: 'image' });

    const allPosts =
      allPostsImagesCache.length > 4
        ? allPostsImagesCache
        : await postServices.getPostsFromDB({ file: 'image' }, skip, limit, { createdAt: -1 });
    // response
    res.status(HTTP_STATUS.OK).json({
      message: 'Get all image posts successfully.',
      postWithImages: allPosts,
      currentPage: Number(page),
      numberOfPages: Math.ceil(numberOfPosts / PAGE_SIZE)
    });
  }
  /*
   *
   * get post with videos
   *
   */

  public async getAllPostWithVideo(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;

    const newSkip: number = skip === 0 ? skip : skip + 1;
    // get all
    const allPostsVideosCache = await postCache.getPostFromCacheVideos('post', newSkip, limit);
    const numberOfPosts = await postServices.postCountDB({ file: 'video' });

    const allPosts =
      allPostsVideosCache.length > 4
        ? allPostsVideosCache
        : await postServices.getPostsFromDB({ file: 'video' }, skip, limit, { createdAt: -1 });
    // response
    res.status(HTTP_STATUS.OK).json({
      message: 'Get all image posts successfully.',
      postWithVideos: allPosts,
      currentPage: Number(page),
      numberOfPages: Math.ceil(numberOfPosts / PAGE_SIZE)
    });
  }

  public async getPostById(req: Request, res: Response): Promise<void> {
    const getSinglePostCache = await postCache.getPostByIdFromCache(`${req.params?.postId}`);

    const getPostById: IPostDocument = getSinglePostCache
      ? getSinglePostCache
      : await postServices.getSinglePostById(`${req.params?.postId}`);

    if (!getPostById) {
      throw new BadRequestError('Post not found.');
    }

    res.status(HTTP_STATUS.OK).json({ message: 'Get single post.', post: getPostById });
  }
}
