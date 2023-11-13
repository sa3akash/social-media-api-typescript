import Joi, { ObjectSchema } from 'joi';

const postSchema: ObjectSchema = Joi.object().keys({
  post: Joi.string().optional().allow(null, ''),
  bgColor: Joi.string().optional().allow(null, ''),
  privacy: Joi.string().required().valid('Public', 'Private', 'Only me'),
  feelings: Joi.string().optional().allow(null, ''),
  gifUrl: Joi.string().optional().allow(null, '')
});

export { postSchema };
