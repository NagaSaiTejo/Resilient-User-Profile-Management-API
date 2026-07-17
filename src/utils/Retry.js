/**
 * Executes a function with exponential backoff retry logic.
 *
 * @param {Function} operation - The async function to execute.
 * @param {number} maxAttempts - Maximum number of attempts.
 * @param {number} baseDelayMs - Initial delay in milliseconds.
 * @returns {Promise<any>} - Resolves with the result of the operation.
 * @throws {Error} - Throws the last error if all attempts fail.
 */
async function withRetry(operation, maxAttempts = 3, baseDelayMs = 100) {
  let attempt = 1;
  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`[Retry] Attempt ${attempt} failed: ${error.message}. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempt++;
    }
  }
}

module.exports = {
  withRetry
};
