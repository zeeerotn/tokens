import type { TraceType, RedactionRule } from '~/tracer/types.ts';
import type { RedactorInterface } from '~/tracer/interfaces.ts';

export class Redactor implements RedactorInterface {
  constructor(private rules: RedactionRule[]) {}

  public redact(trace: TraceType): TraceType {
    const redacted = structuredClone(trace);
    
    for (const rule of this.rules) {
      for (const path of rule.paths) {
        this.applyRedaction(redacted, path, rule);
      }
    }
    
    return redacted;
  }

  private applyRedaction(obj: any, path: string, rule: RedactionRule): void {
    const parts = this.parsePath(path);
    this.traverseAndRedact(obj, parts, 0, rule);
  }

  private parsePath(path: string): Array<string | { type: 'array' | 'wildcard'; key?: string }> {
    const segments: Array<string | { type: 'array' | 'wildcard'; key?: string }> = [];
    const parts = path.split('.');
    
    for (const part of parts) {
      if (part === '*') {
        segments.push({ type: 'wildcard' });
      } else if (part.includes('[]')) {
        // Handle array notation: entries[] or entries[].data becomes array marker
        const baseName = part.replace('[]', '');
        if (baseName) {
          segments.push(baseName);
        }
        segments.push({ type: 'array' });
      } else {
        segments.push(part);
      }
    }
    
    return segments;
  }

  private traverseAndRedact(
    obj: any,
    parts: Array<string | { type: 'array' | 'wildcard'; key?: string }>,
    index: number,
    rule: RedactionRule
  ): void {
    if (index >= parts.length || obj === null || obj === undefined) {
      return;
    }

    const part = parts[index];
    const isLast = index === parts.length - 1;

    if (typeof part === 'object' && part.type === 'wildcard') {
      // Wildcard: traverse all keys in current object
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        for (const key of Object.keys(obj)) {
          if (isLast) {
            // This shouldn't happen - wildcard should not be last
            continue;
          }
          this.traverseAndRedact(obj[key], parts, index + 1, rule);
        }
      }
    } else if (typeof part === 'object' && part.type === 'array') {
      // Array: iterate through all items
      if (Array.isArray(obj)) {
        for (const item of obj) {
          this.traverseAndRedact(item, parts, index + 1, rule);
        }
      }
    } else if (typeof part === 'string') {
      if (isLast) {
        this.redactValue(obj, part, rule);
      } else if (obj[part] !== undefined) {
        this.traverseAndRedact(obj[part], parts, index + 1, rule);
      }
    }
  }

  private redactValue(obj: any, key: string, rule: RedactionRule): void {
    if (obj === null || typeof obj !== 'object' || !(key in obj)) {
      return;
    }

    switch (rule.action) {
      case 'mask':
        obj[key] = rule.replacement ?? '[REDACTED]';
        break;
      case 'remove':
        delete obj[key];
        break;
      case 'hash':
        obj[key] = this.hashValue(obj[key]);
        break;
    }
  }

  private hashValue(value: unknown): string {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `[HASH:${Math.abs(hash).toString(16).padStart(8, '0')}]`;
  }
}

export default Redactor;
