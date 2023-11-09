import Joi, { ObjectSchema } from 'joi';

const loginSchema: ObjectSchema = Joi.object().keys({
  email: Joi.string().required().email().messages({
    'string.base': 'Email or username must be of type string.',
    'string.email': 'Email must be valid.',
    'string.empty': 'Email or username is a required field.'
  }),
  password: Joi.string().required().min(6).max(30).messages({
    'string.base': 'Password must be of type string.',
    'string.min': 'Password minimume 6 charecters.',
    'string.max': 'Password maximum 30 charecters.',
    'string.empty': 'Password is a required field.'
  })
});

export { loginSchema };
