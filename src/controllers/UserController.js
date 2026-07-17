class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  createUser = async (req, res, next) => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req, res, next) => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'User not found', details: [] });
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req, res, next) => {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'User not found', details: [] });
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      const deleted = await this.userService.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'User not found', details: [] });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getEnrichedUser = async (req, res, next) => {
    try {
      const user = await this.userService.getEnrichedUser(req.params.id);
      if (!user) {
        return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'User not found', details: [] });
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = UserController;
