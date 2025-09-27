
/**
 * Utility functions for proper error handling
 */

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Safely extract error message from unknown error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

/**
 * Create a standardized error object
 */
export const createAppError = (message: string, code?: string, details?: unknown): AppError => ({
  message,
  code,
  details,
});

/**
 * Handle Supabase errors with proper typing
 */
export const handleSupabaseError = (error: unknown): AppError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return createAppError(
      error.message as string,
      'code' in error ? (error.code as string) : undefined,
      error
    );
  }
  return createAppError(getErrorMessage(error), 'UNKNOWN_ERROR', error);
};
