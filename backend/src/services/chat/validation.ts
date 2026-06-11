import type { ValidationViolation } from './piiDetector.ts';
import { piiDetector } from './piiDetector.ts';
import { urlDetector } from './urlDetector.ts';
import { chatRateLimiter } from './rateLimiter.ts';

interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
  sanitizedContent?: string;
}

class ChatValidationEngine {
  async validateMessage(
    userId: string,
    content: string,
    chatSessionId: string
  ): Promise<ValidationResult> {
    const violations: ValidationViolation[] = [];

    // 1. Rate limiting check
    const rateLimitResult = await chatRateLimiter.checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      violations.push({
        ruleId: 'rate_limit',
        ruleName: 'Message Rate Limit',
        ruleType: 'rate_limit',
        severity: 'block',
        matchedContent: `${rateLimitResult.count}/${rateLimitResult.limit}`,
        message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter}s`
      });
    }

    // 2. PII Detection
    const piiViolations = piiDetector.detect(content);
    violations.push(...piiViolations);

    // 3. URL/Link Detection
    const urlViolations = urlDetector.detect(content);
    violations.push(...urlViolations);

    const blockingViolations = violations.filter(v => v.severity === 'block');
    
    return {
      isValid: blockingViolations.length === 0,
      violations,
      sanitizedContent: blockingViolations.length > 0 ? undefined : content
    };
  }
}

export const validationEngine = new ChatValidationEngine();
