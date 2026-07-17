const Joi = require('joi');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      return next(error);
    }
    req[property] = value;
    next();
  };
};

const userSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().required()
});

const userUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  email: Joi.string().email()
}).min(1);

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

module.exports = {
  validate,
  userSchema,
  userUpdateSchema,
  idParamSchema
};
