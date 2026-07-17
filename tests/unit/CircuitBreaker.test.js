const CircuitBreaker = require('../../src/utils/CircuitBreaker');

describe('CircuitBreaker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute operation successfully in CLOSED state', async () => {
    const mockOp = jest.fn().mockResolvedValue('success');
    const cb = new CircuitBreaker(mockOp);

    const result = await cb.fire();
    expect(result).toBe('success');
    expect(cb.state).toBe('CLOSED');
  });

  it('should open circuit after failure threshold is reached', async () => {
    const mockOp = jest.fn().mockRejectedValue(new Error('fail'));
    const cb = new CircuitBreaker(mockOp, { failureThreshold: 3 });

    await expect(cb.fire()).rejects.toThrow('fail');
    await expect(cb.fire()).rejects.toThrow('fail');
    await expect(cb.fire()).rejects.toThrow('fail');

    expect(cb.state).toBe('OPEN');

    // Next call should fail immediately with Circuit Breaker error
    await expect(cb.fire()).rejects.toThrow('Circuit Breaker is OPEN');
    expect(mockOp).toHaveBeenCalledTimes(3); // The 4th call was blocked
  });

  it('should transition to HALF-OPEN after reset timeout', async () => {
    const mockOp = jest.fn().mockRejectedValue(new Error('fail'));
    const cb = new CircuitBreaker(mockOp, { failureThreshold: 1, resetTimeoutMs: 1000 });

    await expect(cb.fire()).rejects.toThrow('fail');
    expect(cb.state).toBe('OPEN');

    jest.advanceTimersByTime(1001); // Wait for timeout

    // Mock successful operation for half-open test
    mockOp.mockResolvedValueOnce('success');
    
    const result = await cb.fire();
    expect(result).toBe('success');
    expect(cb.state).toBe('HALF-OPEN');
  });

  it('should transition to CLOSED after half-open success threshold is reached', async () => {
    const mockOp = jest.fn().mockRejectedValue(new Error('fail'));
    const cb = new CircuitBreaker(mockOp, { failureThreshold: 1, resetTimeoutMs: 1000, halfOpenSuccessThreshold: 2 });

    await expect(cb.fire()).rejects.toThrow('fail');
    expect(cb.state).toBe('OPEN');

    jest.advanceTimersByTime(1001);

    mockOp.mockResolvedValue('success');
    
    await cb.fire();
    expect(cb.state).toBe('HALF-OPEN');
    
    await cb.fire();
    expect(cb.state).toBe('CLOSED');
    expect(cb.failureCount).toBe(0);
  });
});
