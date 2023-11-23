import Joi, { ObjectSchema } from 'joi';

const addChatSchema: ObjectSchema = Joi.object().keys({
  conversationId: Joi.string().optional().allow(null, ''),
  receiverId: Joi.string().required(),
  body: Joi.string().optional().allow(null, ''),
  gifUrl: Joi.string().optional().allow(null, ''),
  isRead: Joi.boolean().optional()
});

const markChatSchema: ObjectSchema = Joi.object().keys({
  senderId: Joi.string().required(),
  receiverId: Joi.string().required()
});

export { addChatSchema, markChatSchema };
