import { AddChatController } from '@chat/controllers/add.chat.controllers';
import { DeleteChatController } from '@chat/controllers/delete.controller';
import { getConversationController } from '@chat/controllers/get.chat.controller';
import { ReactionChatController } from '@chat/controllers/reaction.controller';
import { authMiddleware } from '@globals/helpers/authMiddleware';
import { upload } from '@globals/helpers/cloudinaryUpload';
import express, { Router } from 'express';

class ChatRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/chat/message', authMiddleware.verifyUser, upload.array('file'), AddChatController.prototype.message);
    this.router.post('/chat/message/add-chat-user', authMiddleware.verifyUser, AddChatController.prototype.addChatUsers);
    this.router.post('/chat/message/remove-chat-user', authMiddleware.verifyUser, AddChatController.prototype.removeChatUsers);
    this.router.get('/chat/conversations', authMiddleware.verifyUser, getConversationController.prototype.getConversations);
    this.router.get('/chat/messagess/:conversationId', authMiddleware.verifyUser, getConversationController.prototype.getMessagess);
    this.router.put('/chat/messages/delete', authMiddleware.verifyUser, DeleteChatController.prototype.markDelete);
    this.router.put('/chat/messages/reactions', authMiddleware.verifyUser, ReactionChatController.prototype.reactionMessage);
    return this.router;
  }
}

export const chatRoutes: ChatRoutes = new ChatRoutes();
