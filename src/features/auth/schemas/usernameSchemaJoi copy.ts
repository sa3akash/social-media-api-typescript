import Joi, { ObjectSchema } from 'joi';

const usernameSchema: ObjectSchema = Joi.object().keys({
  username: Joi.string().required().min(4).max(30).messages({
    'string.base': 'Username must be of type string.',
    'string.empty': 'Email is a required field.',
    'string.min': 'Username length min 4 charecters.',
    'string.max': 'Username length max 30 charecters.'
  })
});

export { usernameSchema };
