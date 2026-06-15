import type { ValidationViolation } from './piiDetector.ts';

class URLDetector {
  private patterns = {
    url: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    domain: /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|edu|gov|mil|in|io|co|me|ai)\b/gi,
  };

  detect(content: string): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          ruleId: `url_${type}`,
          ruleName: `URL/Link: ${type.toUpperCase()}`,
          ruleType: 'url',
          severity: 'block',
          matchedContent: matches.join(', '),
          message: `Sharing external links or domains is not allowed`
        });
      }
    }
    return violations;
  }
}

export const urlDetector = new URLDetector();
