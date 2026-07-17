class IUnitOfWork {
  async beginTransaction() { throw new Error("Not implemented"); }
  async commit() { throw new Error("Not implemented"); }
  async rollback() { throw new Error("Not implemented"); }
  userRepository() { throw new Error("Not implemented"); }
}

module.exports = IUnitOfWork;
