const CircuitBreaker = require('../utils/CircuitBreaker');
const { withRetry } = require('../utils/Retry');

class EnrichmentClient {
  constructor() {
    this.baseUrl = process.env.EXTERNAL_SERVICE_URL || 'http://localhost:8081/enrich';
    this.timeoutMs = parseInt(process.env.EXTERNAL_SERVICE_TIMEOUT_MS || '1500', 10);
    
    // Circuit Breaker configuration from environment variables
    const cbOptions = {
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5', 10),
      resetTimeoutMs: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS || '30000', 10),
      halfOpenSuccessThreshold: parseInt(process.env.CIRCUIT_BREAKER_HALF_OPEN_SUCCESS_THRESHOLD || '2', 10)
    };

    this.circuitBreaker = new CircuitBreaker(this._fetchData.bind(this), cbOptions);
    
    // Retry configuration
    this.maxAttempts = parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10);
    this.baseDelayMs = parseInt(process.env.RETRY_BASE_DELAY_MS || '100', 10);
  }

  async getEnrichmentData(userId) {
    // Wrap the circuit breaker's fire method with retry logic
    // Retry logic is applied BEFORE the circuit breaker. Wait, if retry wraps CB, 
    // each retry counts as a failure to CB if it fails.
    // It's usually better to wrap the raw call in retry, and put THAT inside the CB, 
    // OR wrap the CB call in retry. The prompt says: "A Retry mechanism with exponential 
    // backoff must be implemented for transient errors encountered when calling the external API, 
    // preceding the circuit breaker's open state."
    // This implies that retries happen *before* deciding the service is totally down (opening the circuit).
    // So the sequence is: Call Service -> Fail? -> Retry -> Retry Fails? -> Circuit Breaker records failure.
    // Therefore, the Circuit Breaker should wrap the Retried operation.
    
    // Actually, wait, let's redefine the CB operation to be the raw fetch wrapped in a Retry?
    // Let's implement it so the CircuitBreaker tracks the *final* outcome of the retried operation.
    
    // Alternatively, if the prompt means Retry happens *within* the Circuit breaker, 
    // so a single "fire" could involve multiple retries, and if all retries fail, it counts as 1 failure to the CB.
    return this.circuitBreaker.fire(userId);
  }

  async _fetchData(userId) {
    // The operation inside CB is wrapped with retry
    return await withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        // We use native fetch (available in Node 18+)
        const response = await fetch(`${this.baseUrl}?userId=${userId}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    }, this.maxAttempts, this.baseDelayMs);
  }
}

module.exports = new EnrichmentClient();
