import Joi, { ObjectSchema } from 'joi';

const addCommentSchema: ObjectSchema = Joi.object().keys({
  parentId: Joi.string().optional().messages({
    'any.required': 'parentId is a required property'
  }),
  replyToUser: Joi.string().optional().messages({
    'any.required': 'replyToUser is a required property'
  }),
  postId: Joi.string().required().messages({
    'any.required': 'postId is a required property'
  }),
  content: Joi.string().required().messages({
    'any.required': 'content is a required property'
  })
});

export { addCommentSchema };
