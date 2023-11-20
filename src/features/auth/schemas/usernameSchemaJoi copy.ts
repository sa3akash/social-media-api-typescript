import Joi, { ObjectSchema } from 'joi';

const usernameSchema: ObjectSchema = Joi.object().keys({
  username: Joi.string().required().min(5).max(16).messages({
    'string.base': 'Username must be of type string.',
    'string.empty': 'Email is a required field.',
    'string.min': 'Username length min 5 charecters.',
    'string.max': 'Username length max 16 charecters.'
  })
});

export { usernameSchema };
