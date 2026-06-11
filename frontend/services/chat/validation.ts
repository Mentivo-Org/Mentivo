export interface ValidationViolation {
  type: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
}

export class ClientValidation {
  static validateBeforeSend(content: string): ValidationResult {
    const violations: ValidationViolation[] = [];

    // Length check
    if (content.length > 5000) {
      violations.push({
        type: 'length',
        message: 'Message too long (max 5000 characters)',
      });
    }

    // PII Detection - Basic Patterns
    const patterns = {
      phone: /(?:\+91[\-\s]?)?[6-9]\d{9}/g,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      upi: /[a-zA-Z0-9.\-]{2,}@[a-zA-Z]{2,}/g,
    };

    if (patterns.phone.test(content)) {
      violations.push({
        type: 'pii_phone',
        message: 'Sharing phone numbers is not allowed for security reasons.',
      });
    }

    if (patterns.email.test(content)) {
      violations.push({
        type: 'pii_email',
        message: 'Sharing email addresses is not allowed for security reasons.',
      });
    }

    if (patterns.upi.test(content)) {
      violations.push({
        type: 'pii_upi',
        message: 'Sharing UPI IDs is not allowed. All payments must happen in-app.',
      });
    }

    // URL Detection
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    if (urlPattern.test(content)) {
      violations.push({
        type: 'url',
        message: 'Sharing external links is restricted.',
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }
}
