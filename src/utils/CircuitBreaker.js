class CircuitBreaker {
  constructor(operation, options = {}) {
    this.operation = operation;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeoutMs || 30000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 2;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF-OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = null;
  }

  async fire(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        console.warn('[CircuitBreaker] Timeout reached. Transitioning to HALF-OPEN.');
        this.state = 'HALF-OPEN';
        this.successCount = 0; // Reset success count for half-open testing
      } else {
        throw new Error('Circuit Breaker is OPEN');
      }
    }

    try {
      const result = await this.operation(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    if (this.state === 'HALF-OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        console.info('[CircuitBreaker] Success threshold met. Transitioning to CLOSED.');
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on a successful call while closed
      this.failureCount = 0;
    }
  }

  onFailure() {
    this.failureCount++;
    console.warn(`[CircuitBreaker] Failure detected. Current failure count: ${this.failureCount}`);

    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      console.error(`[CircuitBreaker] Failure threshold reached. Transitioning to OPEN.`);
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    } else if (this.state === 'HALF-OPEN') {
      console.error(`[CircuitBreaker] Failure in HALF-OPEN state. Transitioning back to OPEN.`);
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}

module.exports = CircuitBreaker;
