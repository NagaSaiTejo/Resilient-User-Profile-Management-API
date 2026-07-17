const { v4: uuidv4 } = require('uuid');
const enrichmentClient = require('../external/EnrichmentClient');

class UserService {
  constructor(unitOfWorkPool) {
    this.unitOfWorkPool = unitOfWorkPool;
  }

  async createUser(userData) {
    const uow = new this.unitOfWorkPool();
    try {
      await uow.beginTransaction();
      const userRepo = uow.userRepository();

      const existingUser = await userRepo.findByEmail(userData.email);
      if (existingUser) {
        const error = new Error('Email already exists');
        error.code = 'EMAIL_DUPLICATE';
        throw error;
      }

      const newUser = {
        id: uuidv4(),
        name: userData.name,
        email: userData.email,
        registrationDate: new Date()
      };

      const savedUser = await userRepo.save(newUser);
      await uow.commit();
      return savedUser;
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }

  async getUserById(id) {
    const uow = new this.unitOfWorkPool();
    try {
      await uow.beginTransaction();
      const userRepo = uow.userRepository();
      const user = await userRepo.findById(id);
      await uow.commit();
      return user;
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }

  async updateUser(id, updates) {
    const uow = new this.unitOfWorkPool();
    try {
      await uow.beginTransaction();
      const userRepo = uow.userRepository();

      const existingUser = await userRepo.findById(id);
      if (!existingUser) {
        await uow.commit();
        return null;
      }

      if (updates.email && updates.email !== existingUser.email) {
        const emailCheck = await userRepo.findByEmail(updates.email);
        if (emailCheck) {
          const error = new Error('Email already exists');
          error.code = 'EMAIL_DUPLICATE';
          throw error;
        }
      }

      const updatedUser = {
        ...existingUser,
        ...updates
      };

      const savedUser = await userRepo.save(updatedUser);
      await uow.commit();
      return savedUser;
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }

  async deleteUser(id) {
    const uow = new this.unitOfWorkPool();
    try {
      await uow.beginTransaction();
      const userRepo = uow.userRepository();
      const deleted = await userRepo.delete(id);
      await uow.commit();
      return deleted;
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }

  async getEnrichedUser(id) {
    const user = await this.getUserById(id);
    if (!user) return null;

    try {
      const enrichmentData = await enrichmentClient.getEnrichmentData(id);
      return {
        ...user,
        enrichedDataStatus: 'available',
        enrichment: enrichmentData
      };
    } catch (error) {
      console.error(`[UserService] Enrichment failed for user ${id}:`, error.message);
      return {
        ...user,
        enrichedDataStatus: 'unavailable',
        enrichmentMessage: 'External enrichment service is currently unavailable.'
      };
    }
  }
}

module.exports = UserService;
