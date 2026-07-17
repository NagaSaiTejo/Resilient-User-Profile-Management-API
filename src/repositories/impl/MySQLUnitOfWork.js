const IUnitOfWork = require('../interfaces/IUnitOfWork');
const MySQLUserRepository = require('./MySQLUserRepository');

class MySQLUnitOfWork extends IUnitOfWork {
  constructor(pool) {
    super();
    this.pool = pool;
    this.connection = null;
    this._userRepository = null;
  }

  async beginTransaction() {
    this.connection = await this.pool.getConnection();
    await this.connection.beginTransaction();
    this._userRepository = new MySQLUserRepository(this.connection);
  }

  async commit() {
    if (!this.connection) throw new Error("No active transaction");
    await this.connection.commit();
    this.connection.release();
    this.connection = null;
    this._userRepository = null;
  }

  async rollback() {
    if (!this.connection) return; // Ignore if no transaction started
    await this.connection.rollback();
    this.connection.release();
    this.connection = null;
    this._userRepository = null;
  }

  userRepository() {
    if (!this._userRepository) {
      throw new Error("Transaction has not been started. Call beginTransaction() first.");
    }
    return this._userRepository;
  }
}

module.exports = MySQLUnitOfWork;
