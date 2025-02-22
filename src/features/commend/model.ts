/* eslint-disable @typescript-eslint/no-explicit-any */
import { IReactions } from '@reaction/interfaces/reaction.interface';
import mongoose, { Document, Model, Schema } from 'mongoose';

interface IComment extends Document {
    content: string;
    author: mongoose.Types.ObjectId;
    postId: mongoose.Types.ObjectId;
    parentId: mongoose.Types.ObjectId | null;
    replyToUser: mongoose.Types.ObjectId | null;
    path: mongoose.Types.ObjectId[];
    depth: number;
    reactions?: IReactions;
    createdAt: Date;
    updatedAt: Date;
}

interface CommentModel extends Model<IComment> {
    getCommentsWithReplyCount(postId: string, lastCreatedAt: Date | null, limit?: number): Promise<any[]>;
    getRepliesWithReplyCount(commentId: string, lastCreatedAt: Date | null, limit?: number): Promise<any[]>;
}

const CommentSchema = new Schema<IComment>(
    {
        content: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
        replyToUser: { type: Schema.Types.ObjectId, ref: 'Auth', default: null },
        postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
        parentId: { type: Schema.Types.ObjectId, ref: 'Commend', default: null },
        path: { type: [Schema.Types.ObjectId], index: true },
        depth: { type: Number, default: 0 },
        reactions: {
            like: { type: Number, default: 0 },
            love: { type: Number, default: 0 },
            care: { type: Number, default: 0 },
            happy: { type: Number, default: 0 },
            wow: { type: Number, default: 0 },
            sad: { type: Number, default: 0 },
            angry: { type: Number, default: 0 }
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

CommentSchema.index({ postId: 1, path: 1, createdAt: -1, parentId: 1 });

// Get paginated comments with reply count
CommentSchema.statics.getCommentsWithReplyCount = async function (postId: string, lastCreatedAt: Date | null, limit: number = 5) {
    const filter: any = { postId: new mongoose.Types.ObjectId(postId), depth: 0 };
    if (lastCreatedAt) {
        const date = new Date(lastCreatedAt); // Ensure it's a Date object
        if (!isNaN(date.getTime())) {
            filter.createdAt = { $lt: date };
        }
    }

    const comments = await this.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'Commend',
                localField: '_id',
                foreignField: 'parentId',
                as: 'replies'
            }
        },
        {
            $addFields: {
                replyCount: { $size: '$replies' }
            }
        },
        {
            $lookup: {
                from: 'Auth', // Ensure the correct collection name
                localField: 'author',
                foreignField: '_id',
                as: 'author'
            }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'Auth',
                localField: 'replyToUser',
                foreignField: '_id',
                as: 'replyToUser'
            }
        },
        { $unwind: { path: '$replyToUser', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                replies: 0,
                'author.password': 0, // Hide sensitive data
                'author.passwordResetToken': 0,
                'replyToUser.passwordResetToken': 0,
                'replyToUser.password': 0,
            }
        }
    ]);

    return comments;
};

// Get paginated replies with their reply count
CommentSchema.statics.getRepliesWithReplyCount = async function (commentId: string, lastCreatedAt: Date | null, limit: number = 5) {
    const parentComment = await this.findById(commentId);
    if (!parentComment) return [];

    const filter: any = { postId: parentComment.postId, parentId: parentComment._id };

    if (lastCreatedAt) {
        const date = new Date(lastCreatedAt); // Ensure it's a Date object
        if (!isNaN(date.getTime())) {
            filter.createdAt = { $lt: date };
        }
    }

    const replies = await this.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'Commend',
                localField: '_id',
                foreignField: 'parentId',
                as: 'nestedReplies'
            }
        },
        {
            $addFields: {
                replyCount: { $size: '$nestedReplies' }
            }
        },
        {
            $lookup: {
                from: 'Auth', // Ensure the correct collection name
                localField: 'author',
                foreignField: '_id',
                as: 'author'
            }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'Auth',
                localField: 'replyToUser',
                foreignField: '_id',
                as: 'replyToUser'
            }
        },
        { $unwind: { path: '$replyToUser', preserveNullAndEmptyArrays: true } },

        {
            $project: {
                nestedReplies: 0,
                'author.password': 0, // Hide sensitive data
                'author.passwordResetToken': 0,
                'replyToUser.passwordResetToken': 0,
                'replyToUser.password': 0,
            }
        }
    ]);

    return replies;
};

export const CommentModel = mongoose.model<IComment, CommentModel>('Commend', CommentSchema, 'Commend');




















// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { IReactions } from '@reaction/interfaces/reaction.interface';
// import mongoose, { Document, Model, Schema } from 'mongoose';

// interface IComment extends Document {
//     content: string;
//     author: mongoose.Types.ObjectId;
//     postId: mongoose.Types.ObjectId;
//     parentId: mongoose.Types.ObjectId | null;
//     replyToUser: mongoose.Types.ObjectId | null;
//     path: mongoose.Types.ObjectId[];  // Stores parent hierarchy
//     depth: number;
//     reactions?: IReactions;
//     createdAt: Date;
//     updatedAt: Date;
// }

// interface CommentModel extends Model<IComment> {
//     getCommentsForPost(postId: string, lastCreatedAt: Date | null, limit?: number): Promise<IComment[]>;
//     getRepliesForComment(commentId: string, lastCreatedAt: Date | null, limit?: number): Promise<IComment[]>;
// }

// const CommentSchema = new Schema<IComment>(
//     {
//         content: { type: String, required: true },
//         author: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
//         replyToUser: { type: Schema.Types.ObjectId, ref: 'Auth', default: null },
//         postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
//         parentId: { type: Schema.Types.ObjectId, ref: 'Commend', default: null },
//         path: { type: [Schema.Types.ObjectId], index: true },
//         depth: { type: Number, default: 0 },
//         reactions: {
//             like: { type: Number, default: 0 },
//             love: { type: Number, default: 0 },
//             care: { type: Number, default: 0 },
//             happy: { type: Number, default: 0 },
//             wow: { type: Number, default: 0 },
//             sad: { type: Number, default: 0 },
//             angry: { type: Number, default: 0 }
//         },
//         createdAt: { type: Date, default: Date.now },
//         updatedAt: { type: Date, default: Date.now }
//     },
//     { timestamps: true }
// );

// CommentSchema.index({ postId: 1, path: 1, createdAt: -1, parentId: 1 });

// // Get paginated comments (root level)
// CommentSchema.statics.getCommentsForPost = async function (postId: string, lastCreatedAt: Date | null, limit: number = 10) {
//     const filter: any = { postId, depth: 0 };
//     if (lastCreatedAt) filter.createdAt = { $lt: lastCreatedAt };

//     return this.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
// };

// // Get paginated replies
// CommentSchema.statics.getRepliesForComment = async function (commentId: string, lastCreatedAt: Date | null, limit: number = 10) {
//     const parentComment = await this.findById(commentId);
//     if (!parentComment) return [];

//     const filter: any = { postId: parentComment.postId, path: parentComment._id,parentId:parentComment._id };
//     if (lastCreatedAt) filter.createdAt = { $lt: lastCreatedAt };

//     return this.find(filter).sort({ createdAt: 1 }).limit(limit).lean();
// };

// export const CommentModel = mongoose.model<IComment, CommentModel>('Commend', CommentSchema, 'Commend');
