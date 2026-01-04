import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially unsafe HTML string
 * @param {object} options - Additional options for DOMPurify
 * @returns {string} - The sanitized HTML string
 */
export const sanitizeHTML = (dirty, options = {}) => {
  if (typeof dirty !== 'string') {
    return '';
  }

  // Default options for banking application
  const defaultOptions = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'b', 'i'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ...options
  };

  return DOMPurify.sanitize(dirty, defaultOptions);
};

/**
 * Sanitizes plain text by escaping HTML entities
 * @param {string} text - The plain text to sanitize
 * @returns {string} - The sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  // Escape HTML entities correctly
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes user input for display in React components
 * @param {string} input - The user input to sanitize
 * @param {boolean} allowHTML - Whether to allow basic HTML tags
 * @returns {string} - The sanitized content
 */
export const sanitizeUserInput = (input, allowHTML = false) => {
  if (typeof input !== 'string') {
    return '';
  }

  return allowHTML ? sanitizeHTML(input) : sanitizeText(input);
};
