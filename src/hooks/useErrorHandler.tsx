
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = "An unexpected error occurred"
    } = options;

    // Extract error message safely
    let errorMessage = fallbackMessage;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }

    // Log error for debugging
    if (logError) {
      console.error('Error handled:', {
        error,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Show user-friendly toast
    if (showToast) {
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }

    return errorMessage;
  }, [toast]);

  const handleAsyncError = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
};
