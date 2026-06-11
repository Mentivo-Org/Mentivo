export interface ValidationViolation {
  ruleId: string;
  ruleName: string;
  ruleType: 'pii' | 'url' | 'rate_limit' | 'profanity' | 'custom';
  severity: 'block' | 'flag' | 'warn';
  matchedContent: string;
  message: string;
}

class PIIDetector {
  private patterns = {
    phone: /(?:\+91[\-\s]?)?[6-9]\d{9}/g,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    upi: /[a-zA-Z0-9.\-]{2,}@[a-zA-Z]{2,}/g,
    aadhaar: /\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/g,
    pan: /[A-Z]{5}\d{4}[A-Z]{1}/g,
    socialHandle: /@[a-zA-Z0-9._]{3,}/g,
  };

  detect(content: string): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          ruleId: `pii_${type}`,
          ruleName: `PII: ${type.toUpperCase()}`,
          ruleType: 'pii',
          severity: 'block',
          matchedContent: matches.join(', '),
          message: `Sharing ${type} is not allowed on the platform`
        });
      }
    }
    return violations;
  }
}

export const piiDetector = new PIIDetector();
