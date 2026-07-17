class IUserRepository {
  /**
   * Creates or updates a user
   * @param {Object} user - The user object to save
   * @returns {Promise<Object>} The saved user
   */
  async save(user) { throw new Error("Not implemented"); }

  /**
   * Finds a user by ID
   * @param {string} id - The user ID
   * @returns {Promise<Object|null>} The user object or null
   */
  async findById(id) { throw new Error("Not implemented"); }

  /**
   * Deletes a user by ID
   * @param {string} id - The user ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) { throw new Error("Not implemented"); }

  /**
   * Finds a user by email
   * @param {string} email - The user email
   * @returns {Promise<Object|null>} The user object or null
   */
  async findByEmail(email) { throw new Error("Not implemented"); }
}

module.exports = IUserRepository;
