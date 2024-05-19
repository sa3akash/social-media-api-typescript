import Joi, { ObjectSchema } from 'joi';

const basicInfoSchema: ObjectSchema = Joi.object().keys({
  work: Joi.string().optional().allow(null, ''),
  school: Joi.string().optional().allow(null, ''),
  website: Joi.string().optional().allow(null, ''),
  gender: Joi.string().optional().valid('male', 'female', 'custom').allow(null, ''),
  facebook: Joi.string().optional().allow(null, ''),
  instagram: Joi.string().optional().allow(null, ''),
  twitter: Joi.string().optional().allow(null, ''),
  youtube: Joi.string().optional().allow(null, ''),
  quote: Joi.string().optional().allow(null, ''),
  relationShipType: Joi.string().valid('Single', 'In a relationship', 'Married', 'Divorced').optional().allow(null, ''),
  relationShipPartner: Joi.string().optional().allow(null, ''),
  addStreet: Joi.string().optional().allow(null, ''),
  addcity: Joi.string().optional().allow(null, ''),
  addZipcode: Joi.string().optional().allow(null, ''),
  addLocal: Joi.string().optional().allow(null, ''),
  addCountry: Joi.string().optional().allow(null, ''),
  dobDay: Joi.string().optional().allow(null, ''),
  dobMonth: Joi.string().optional().allow(null, ''),
  dobYear: Joi.string().optional().allow(null, ''),
  firstName: Joi.string().optional().allow(null, ''),
  lastName: Joi.string().optional().allow(null, ''),
  nickName: Joi.string().optional().allow(null, '')
});

const queueSchema: ObjectSchema = Joi.object().keys({
  quote: Joi.string().optional().allow(null, '')
});

const changePasswordSchema: ObjectSchema = Joi.object().keys({
  currentPassword: Joi.string().required().min(6).max(30).messages({
    'string.base': 'Password should be a type of string',
    'string.min': 'Password must have a minimum length of {#limit}',
    'string.max': 'Password should have a maximum length of {#limit}',
    'string.empty': 'Password is a required field'
  }),
  newPassword: Joi.string().required().min(6).max(30).messages({
    'string.base': 'Password should be a type of string',
    'string.min': 'Password must have a minimum length of {#limit}',
    'string.max': 'Password should have a maximum length of {#limit}',
    'string.empty': 'Password is a required field'
  }),
  confirmPassword: Joi.any().equal(Joi.ref('newPassword')).required().messages({
    'any.only': 'Confirm password does not match new password.'
  })
});

const notificationSettingsSchema: ObjectSchema = Joi.object().keys({
  messages: Joi.boolean().optional(),
  reactions: Joi.boolean().optional(),
  comments: Joi.boolean().optional(),
  follows: Joi.boolean().optional()
});

export { basicInfoSchema, queueSchema, changePasswordSchema, notificationSettingsSchema };
