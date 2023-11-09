import Joi, { ObjectSchema } from 'joi';

const signupSchema: ObjectSchema = Joi.object().keys({
  firstname: Joi.string().required().min(3).max(8).messages({
    'string.base': 'First name must be of type string.',
    'string.min': 'First name must be 3 charecters.',
    'string.max': 'First name must be less then 8 charecters.',
    'string.empty': 'First name is a required field.'
  }),
  lastname: Joi.string().required().min(3).max(8).messages({
    'string.base': 'Last name must be of type string.',
    'string.min': 'Invalid name.',
    'string.max': 'Invalid name.',
    'string.empty': 'Last name is a required field.'
  }),
  gender: Joi.string().required().valid('male', 'female', 'custom').messages({
    'string.any': 'Status must be one of "male", "female", or "custom"',
    'string.empty': 'Gender is a required field.'
  }),
  password: Joi.string().required().min(6).max(30).messages({
    'string.base': 'Password must be of type string.',
    'string.min': 'Invalid password.',
    'string.max': 'Invalid password.',
    'string.empty': 'Password is a required field.'
  }),
  email: Joi.string().required().email().messages({
    'string.base': 'Email must be of type string.',
    'string.email': 'Email must be valid.',
    'string.empty': 'Email is a required field.'
  })
});

export { signupSchema };
