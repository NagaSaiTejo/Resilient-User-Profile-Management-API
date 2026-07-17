const UserService = require('../../src/services/UserService');
const enrichmentClient = require('../../src/external/EnrichmentClient');

jest.mock('../../src/external/EnrichmentClient');

describe('UserService', () => {
  let userService;
  let mockUserRepo;
  let mockUow;
  let mockUowPool;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    };

    mockUow = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      userRepository: jest.fn().mockReturnValue(mockUserRepo)
    };

    mockUowPool = jest.fn().mockImplementation(() => mockUow);
    userService = new UserService(mockUowPool);
    
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      const savedUser = { id: 'uuid', name: 'John Doe', email: 'john@example.com', registrationDate: new Date() };
      mockUserRepo.save.mockResolvedValue(savedUser);

      const result = await userService.createUser({ name: 'John Doe', email: 'john@example.com' });

      expect(result).toEqual(savedUser);
      expect(mockUow.beginTransaction).toHaveBeenCalled();
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockUow.commit).toHaveBeenCalled();
      expect(mockUow.rollback).not.toHaveBeenCalled();
    });

    it('should throw an error if email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ id: 'existing-id' });

      await expect(userService.createUser({ name: 'John Doe', email: 'john@example.com' }))
        .rejects.toThrow('Email already exists');

      expect(mockUow.rollback).toHaveBeenCalled();
      expect(mockUow.commit).not.toHaveBeenCalled();
    });
  });

  describe('getEnrichedUser', () => {
    it('should return enriched data if external service succeeds', async () => {
      const mockUser = { id: 'uuid', name: 'John', email: 'j@e.com' };
      mockUserRepo.findById.mockResolvedValue(mockUser);
      enrichmentClient.getEnrichmentData.mockResolvedValue({ loyaltyScore: 100 });

      const result = await userService.getEnrichedUser('uuid');

      expect(result.enrichedDataStatus).toBe('available');
      expect(result.enrichment).toEqual({ loyaltyScore: 100 });
      expect(result.name).toBe('John');
    });

    it('should handle external service failure gracefully', async () => {
      const mockUser = { id: 'uuid', name: 'John', email: 'j@e.com' };
      mockUserRepo.findById.mockResolvedValue(mockUser);
      enrichmentClient.getEnrichmentData.mockRejectedValue(new Error('Service down'));

      const result = await userService.getEnrichedUser('uuid');

      expect(result.enrichedDataStatus).toBe('unavailable');
      expect(result.enrichment).toBeUndefined();
      expect(result.enrichmentMessage).toBe('External enrichment service is currently unavailable.');
    });
  });
});
