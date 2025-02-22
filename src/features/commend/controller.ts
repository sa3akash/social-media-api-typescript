import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CommentModel } from './model';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { AuthModel } from '@auth/models/auth.db.model';

export const createComment = async (req: Request, res: Response) => {
  const { content, postId, replyToUser } = req.body;
  let parentId = req.body.parentId;
  const author = req.currentUser?.id; // Assuming auth middleware

  let path: mongoose.Types.ObjectId[] = [];
  let depth = 0;

  if (parentId) {
    const parentComment = await CommentModel.findById(parentId);
    if (!parentComment) throw new BadRequestError('Parent comment not found');
    console.log(parentComment);

    if (parentComment.depth >= 3) {
      parentId = parentComment.parentId;
      depth = parentComment.depth;
      path = [...parentComment.path];
    } else {
      path = [...parentComment.path, parentComment._id];
      depth = parentComment.depth + 1;
    }
  }

  let replyUser;

  if (replyToUser) {
    replyUser = await AuthModel.findById(replyToUser);
    if (!replyUser) throw new BadRequestError('User does not exist');

    const getCheckComment = await CommentModel.findOne({ postId, author: replyToUser });
    if (!getCheckComment) throw new BadRequestError('Comment does not exist');
  }

  const newComment = new CommentModel({ content, author, postId, parentId, replyToUser, path, depth });
  await newComment.save();

  res.status(201).json({
    ...newComment.toJSON(),
    author: req.currentUser,
    replyToUser: replyUser
  });
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { lastCreatedAt, limit } = req.query;

    const comments = await CommentModel.getCommentsWithReplyCount(
      postId,
      lastCreatedAt ? new Date(lastCreatedAt as string) : null,
      Number(limit) || 5
    );
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const getReplies = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { lastCreatedAt, limit } = req.query;
    console.log('reply', lastCreatedAt);
    const replies = await CommentModel.getRepliesWithReplyCount(
      commentId,
      lastCreatedAt ? new Date(lastCreatedAt as string) : null,
      Number(limit) || 5
    );
    res.status(200).json(replies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
};
