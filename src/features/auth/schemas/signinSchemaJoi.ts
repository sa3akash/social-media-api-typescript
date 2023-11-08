import Joi, { ObjectSchema } from 'joi';

const loginSchema: ObjectSchema = Joi.object().keys({
  email: Joi.string().required().messages({
    'string.base': 'Email or username must be of type string.',
    'string.empty': 'Email or username is a required field.'
  }),
  password: Joi.string().required().min(4).max(8).messages({
    'string.base': 'Password must be of type string.',
    'string.min': 'Invalid password.',
    'string.max': 'Invalid password.',
    'string.empty': 'Password is a required field.'
  })
});

export { loginSchema };
