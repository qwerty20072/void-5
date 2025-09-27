
/**
 * Security utility functions for input validation and sanitization
 */

// Email validation regex - more strict than browser default
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Safe HTML content validator - prevents XSS
const SAFE_HTML_REGEX = /^[a-zA-Z0-9\s\-_.,!?()[\]]+$/;

/**
 * Validates email format with strict regex
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string' || email.length > 254) {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Sanitizes string input to prevent XSS
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

/**
 * Validates that HTML content is safe (no scripts, etc.)
 */
export const validateSafeHTML = (html: string): boolean => {
  if (!html || typeof html !== 'string') {
    return false;
  }
  
  const lowercased = html.toLowerCase();
  
  // Check for dangerous elements/attributes
  const dangerousPatterns = [
    /<script/,
    /javascript:/,
    /on\w+\s*=/,
    /<iframe/,
    /<object/,
    /<embed/,
    /<form/,
    /expression\s*\(/,
    /vbscript:/,
    /data:/
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(lowercased));
};

/**
 * Validates numeric input
 */
export const validateNumber = (value: any, min?: number, max?: number): boolean => {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return false;
  }
  
  if (min !== undefined && num < min) {
    return false;
  }
  
  if (max !== undefined && num > max) {
    return false;
  }
  
  return true;
};

/**
 * Validates URL format and ensures it's safe
 */
export const validateURL = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsedURL = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedURL.protocol);
  } catch {
    return false;
  }
};

/**
 * Rate limiting helper - tracks attempts by key
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count >= maxAttempts) {
    return false;
  }
  
  existing.count++;
  return true;
};

/**
 * Generates a cryptographically secure random string
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
};

/**
 * Securely stores data in localStorage with encryption flag
 */
export const secureLocalStorage = {
  setItem: (key: string, value: any) => {
    try {
      const sanitizedKey = sanitizeString(key);
      const data = {
        value,
        timestamp: Date.now(),
        secure: true
      };
      localStorage.setItem(`secure_${sanitizedKey}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  },
  
  getItem: (key: string) => {
    try {
      const sanitizedKey = sanitizeString(key);
      const stored = localStorage.getItem(`secure_${sanitizedKey}`);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      // Check if data is older than 24 hours
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`secure_${sanitizedKey}`);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  },
  
  removeItem: (key: string) => {
    try {
      const sanitizedKey = sanitizeString(key);
      localStorage.removeItem(`secure_${sanitizedKey}`);
    } catch (error) {
      console.error('Failed to remove secure data:', error);
    }
  }
};
