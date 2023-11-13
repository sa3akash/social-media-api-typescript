import Joi, { ObjectSchema } from 'joi';

const addReactionSchema: ObjectSchema = Joi.object().keys({
  postId: Joi.string().required().messages({
    'any.required': 'postId is a required property'
  }),
  type: Joi.string().required().valid('like', 'love', 'happy', 'sad', 'angry', 'wow').messages({
    'any.required': 'Reaction type is a required property',
    'any.only': 'Only like, love, sad, angry, happy and wow are allowed.'
  })
});

export { addReactionSchema };
