
/**
 * Security configuration and constants for the application
 */

// Security settings
export const SECURITY_CONFIG = {
  // Authentication
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // Input validation
  MAX_STRING_LENGTH: 1000,
  MAX_EMAIL_LENGTH: 254,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 6,
  
  // File uploads
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain'
  ],
  
  // Rate limiting
  API_RATE_LIMIT: 100, // requests per window
  API_RATE_WINDOW: 15 * 60 * 1000, // 15 minutes
  
  // Content
  MAX_MESSAGE_LENGTH: 5000,
  MAX_PROFILE_BIO_LENGTH: 2000,
  
  // localStorage data expiry
  LOCAL_STORAGE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Trusted domains for external resources
export const TRUSTED_DOMAINS = [
  'supabase.co',
  'stripe.com', 
  'js.stripe.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
] as const;

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "https://*.supabase.co", "https://api.stripe.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
} as const;

// Security headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', 
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?()[\]]+$/,
  FILENAME: /^[a-zA-Z0-9._-]+$/,
  URL: /^https?:\/\/[^\s$.?#].[^\s]*$/
} as const;

// Dangerous content patterns to block
export const DANGEROUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<form/i,
  /expression\s*\(/i,
  /vbscript:/i,
  /data:text\/html/i
] as const;
