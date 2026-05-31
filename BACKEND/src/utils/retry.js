const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retryWithBackoff(
  fn,
  { retries = 2, baseDelayMs = 100, onFinalError } = {}
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (attempt === retries) {
        if (onFinalError) onFinalError(error);
        else throw error;
        return;
      }
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}
