// Type for API responses
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

// Function to handle try/catch pattern with consistent error handling
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorMessage = 'An error occurred'
): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { data, status: 200 };
  } catch (error) {
    console.error(errorMessage, error);
    return {
      error: error instanceof Error ? error.message : errorMessage,
      status: 500
    };
  }
}

// Retry logic with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffFactor?: number;
    retryCondition?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 300,
    backoffFactor = 2,
    retryCondition = () => true
  } = options;

  let lastError: any;
  let currentDelay = delayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if condition is not met
      if (!retryCondition(error)) {
        throw error;
      }
      
      // Last attempt failed, give up
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffFactor;
    }
  }

  throw lastError;
}

// Log errors consistently
export function logError(message: string, error: any, metadata: Record<string, any> = {}) {
  console.error(`ERROR: ${message}`, {
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    timestamp: new Date().toISOString(),
    ...metadata
  });
}

// Format error for client response
export function formatErrorResponse(error: any, defaultMessage = 'An unexpected error occurred') {
  if (error instanceof Error) {
    // Only return message for security, not stack trace
    return { error: error.message || defaultMessage, status: 500 };
  }
  
  if (typeof error === 'string') {
    return { error, status: 500 };
  }
  
  return { error: defaultMessage, status: 500 };
} 