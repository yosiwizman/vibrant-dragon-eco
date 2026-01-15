/**
 * Validation Utilities
 * Provides consistent validation and sanitization across the app
 */

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone number validation (basic)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Date validation
export function isValidDate(date: string | Date): boolean {
  const d = date instanceof Date ? date : new Date(date);
  return !isNaN(d.getTime());
}

// Future date validation
export function isFutureDate(date: string | Date): boolean {
  const d = date instanceof Date ? date : new Date(date);
  return d.getTime() > Date.now();
}

// String length validation
export function isValidLength(
  str: string,
  min: number = 0,
  max: number = Infinity
): boolean {
  return str.length >= min && str.length <= max;
}

// Sanitize string input (remove dangerous characters)
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Sanitize HTML (basic - for display purposes)
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

// Validate and sanitize task input
export function validateTaskInput(input: {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
}): { valid: boolean; errors: string[]; sanitized: typeof input } {
  const errors: string[] = [];
  const sanitized = { ...input };

  // Title validation
  if (!input.title?.trim()) {
    errors.push('Title is required');
  } else if (!isValidLength(input.title, 1, 200)) {
    errors.push('Title must be between 1 and 200 characters');
  } else {
    sanitized.title = sanitizeString(input.title);
  }

  // Description validation
  if (input.description) {
    if (!isValidLength(input.description, 0, 5000)) {
      errors.push('Description must be less than 5000 characters');
    } else {
      sanitized.description = sanitizeString(input.description);
    }
  }

  // Priority validation
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (input.priority && !validPriorities.includes(input.priority)) {
    errors.push('Invalid priority value');
  }

  // Due date validation
  if (input.due_date && !isValidDate(input.due_date)) {
    errors.push('Invalid due date');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

// Validate and sanitize reminder input
export function validateReminderInput(input: {
  text: string;
  due_time: string;
  channel?: string;
}): { valid: boolean; errors: string[]; sanitized: typeof input } {
  const errors: string[] = [];
  const sanitized = { ...input };

  // Text validation
  if (!input.text?.trim()) {
    errors.push('Reminder text is required');
  } else if (!isValidLength(input.text, 1, 500)) {
    errors.push('Reminder text must be between 1 and 500 characters');
  } else {
    sanitized.text = sanitizeString(input.text);
  }

  // Due time validation
  if (!input.due_time) {
    errors.push('Due time is required');
  } else if (!isValidDate(input.due_time)) {
    errors.push('Invalid due time');
  }

  // Channel validation
  const validChannels = ['push', 'sms', 'email'];
  if (input.channel && !validChannels.includes(input.channel)) {
    errors.push('Invalid channel');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

// Validate and sanitize contact input
export function validateContactInput(input: {
  name: string;
  phone: string;
  email?: string;
}): { valid: boolean; errors: string[]; sanitized: typeof input } {
  const errors: string[] = [];
  const sanitized = { ...input };

  // Name validation
  if (!input.name?.trim()) {
    errors.push('Name is required');
  } else if (!isValidLength(input.name, 1, 100)) {
    errors.push('Name must be between 1 and 100 characters');
  } else {
    sanitized.name = sanitizeString(input.name);
  }

  // Phone validation
  if (!input.phone?.trim()) {
    errors.push('Phone number is required');
  } else if (!isValidPhone(input.phone)) {
    errors.push('Invalid phone number');
  }

  // Email validation
  if (input.email && !isValidEmail(input.email)) {
    errors.push('Invalid email address');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

// Validate API key format
export function isValidApiKey(key: string, provider: string): boolean {
  switch (provider) {
    case 'openai':
      return key.startsWith('sk-') && key.length > 20;
    case 'anthropic':
      return key.startsWith('sk-ant-') && key.length > 20;
    default:
      return key.length > 10;
  }
}

// Rate limiting check
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetIn: record.resetTime - now,
  };
}