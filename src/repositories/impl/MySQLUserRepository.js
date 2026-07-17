const IUserRepository = require('../interfaces/IUserRepository');

class MySQLUserRepository extends IUserRepository {
  constructor(connection) {
    super();
    this.connection = connection;
  }

  async save(user) {
    const query = `
      INSERT INTO users (id, name, email, registration_date)
      VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      ON DUPLICATE KEY UPDATE
      name = VALUES(name), email = VALUES(email)
    `;
    const params = [user.id, user.name, user.email, user.registrationDate || null];
    await this.connection.execute(query, params);
    
    // Fetch and return the saved user to get the proper registration date if it was generated
    return await this.findById(user.id);
  }

  async findById(id) {
    const [rows] = await this.connection.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return this._mapToUser(rows[0]);
  }

  async delete(id) {
    const [result] = await this.connection.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async findByEmail(email) {
    const [rows] = await this.connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    return this._mapToUser(rows[0]);
  }

  _mapToUser(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      registrationDate: row.registration_date
    };
  }
}

module.exports = MySQLUserRepository;
