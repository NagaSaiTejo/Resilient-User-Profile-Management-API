const express = require('express');
const { validate, userSchema, userUpdateSchema, idParamSchema } = require('../middleware/validator');

function createUserRoutes(userController) {
  const router = express.Router();

  router.post('/', 
    validate(userSchema, 'body'), 
    userController.createUser
  );

  router.get('/:id', 
    validate(idParamSchema, 'params'), 
    userController.getUserById
  );

  router.put('/:id', 
    validate(idParamSchema, 'params'), 
    validate(userUpdateSchema, 'body'), 
    userController.updateUser
  );

  router.delete('/:id', 
    validate(idParamSchema, 'params'), 
    userController.deleteUser
  );

  router.get('/:id/enriched', 
    validate(idParamSchema, 'params'), 
    userController.getEnrichedUser
  );

  return router;
}

module.exports = createUserRoutes;
