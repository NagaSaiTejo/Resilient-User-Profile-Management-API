const request = require('supertest');
const { initializeApp } = require('../../src/app');

// Mock external service client
jest.mock('../../src/external/EnrichmentClient', () => ({
  getEnrichmentData: jest.fn()
}));
const enrichmentClient = require('../../src/external/EnrichmentClient');

describe('API Integration Tests', () => {
  let app;
  let mockPool;
  let mockConnection;

  beforeAll(async () => {
    // Setup mock DB pool
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      execute: jest.fn()
    };
    
    mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    };

    app = await initializeApp(mockPool);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users', () => {
    it('should create a new user and return 201', async () => {
      // Mock findByEmail to return null (no duplicate)
      mockConnection.execute.mockResolvedValueOnce([[]]); 
      // Mock insert
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock findById to return the saved user
      mockConnection.execute.mockResolvedValueOnce([[{
        id: 'some-uuid',
        name: 'Jane Doe',
        email: 'jane@example.com',
        registration_date: new Date().toISOString()
      }]]);

      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Jane Doe', email: 'jane@example.com' });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Jane Doe');
      expect(res.body.email).toBe('jane@example.com');
      expect(res.body.id).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Jane Doe' }); // Missing email

      expect(res.statusCode).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_INPUT');
    });

    it('should return 409 if email already exists', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ id: 'existing-id' }]]); 

      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Jane Doe', email: 'jane@example.com' });

      expect(res.statusCode).toBe(409);
      expect(res.body.errorCode).toBe('EMAIL_DUPLICATE');
    });
  });

  describe('GET /api/users/:id/enriched', () => {
    it('should return 200 with enriched data', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Doe',
        email: 'jane@example.com'
      }]]);

      enrichmentClient.getEnrichmentData.mockResolvedValueOnce({
        loyaltyScore: 500,
        recentActivity: ['login']
      });

      const res = await request(app).get('/api/users/123e4567-e89b-12d3-a456-426614174000/enriched');

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Jane Doe');
      expect(res.body.enrichedDataStatus).toBe('available');
      expect(res.body.enrichment.loyaltyScore).toBe(500);
    });

    it('should return 200 with unavailable status if enrichment fails', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Doe',
        email: 'jane@example.com'
      }]]);

      enrichmentClient.getEnrichmentData.mockRejectedValueOnce(new Error('Service Unavailable'));

      const res = await request(app).get('/api/users/123e4567-e89b-12d3-a456-426614174000/enriched');

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Jane Doe');
      expect(res.body.enrichedDataStatus).toBe('unavailable');
    });
  });
});
