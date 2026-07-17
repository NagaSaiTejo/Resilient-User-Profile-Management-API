const { withRetry } = require('../../src/utils/Retry');

describe('Retry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    console.warn.mockRestore();
  });

  it('should return result immediately if operation succeeds', async () => {
    const mockOp = jest.fn().mockResolvedValue('success');
    const result = await withRetry(mockOp, 3, 100);
    
    expect(result).toBe('success');
    expect(mockOp).toHaveBeenCalledTimes(1);
  });

  it('should retry operation upon failure and succeed eventually', async () => {
    const mockOp = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(mockOp, 3, 100);
    
    // Fast forward to first delay
    await Promise.resolve(); // Allow error to be caught
    jest.advanceTimersByTime(100); // baseDelayMs * 2^(1-1) = 100

    const result = await promise;
    expect(result).toBe('success');
    expect(mockOp).toHaveBeenCalledTimes(2);
  });

  it('should throw error if max attempts reached', async () => {
    const mockOp = jest.fn().mockRejectedValue(new Error('persistent failure'));

    const promise = withRetry(mockOp, 3, 100);
    
    // Attempt 1 fails, waits 100ms
    await Promise.resolve();
    jest.advanceTimersByTime(100);
    
    // Attempt 2 fails, waits 200ms
    await Promise.resolve();
    jest.advanceTimersByTime(200);

    // Attempt 3 fails, throws
    await expect(promise).rejects.toThrow('persistent failure');
    expect(mockOp).toHaveBeenCalledTimes(3);
  });
});
