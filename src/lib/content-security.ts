
/**
 * Content Security Policy helpers and validation
 */

// CSP directives for secure content loading
export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "https://*.supabase.co", "https://api.stripe.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: []
};

/**
 * Validates that external URLs are from trusted domains
 */
const TRUSTED_DOMAINS = [
  'supabase.co',
  'stripe.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

export const validateExternalURL = (url: string): boolean => {
  try {
    const parsedURL = new URL(url);
    return TRUSTED_DOMAINS.some(domain => 
      parsedURL.hostname === domain || parsedURL.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

/**
 * Sanitizes user-generated content for display
 */
export const sanitizeUserContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  return content
    .replace(/[<>&"']/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        default: return char;
      }
    })
    .trim()
    .substring(0, 5000); // Reasonable content length limit
};

/**
 * Validates file uploads for security
 */
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'application/pdf',
    'text/plain'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check filename for dangerous characters
  const filename = file.name;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return { valid: false, error: 'Filename contains invalid characters' };
  }
  
  return { valid: true };
};

/**
 * Headers for secure HTTP responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
