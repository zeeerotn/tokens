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

  private parsePath(path: string): string[] {
    const segments: string[] = [];
    const parts = path.split('.');
    
    for (const part of parts) {
      if (part === '*') {
        segments.push('*');
      } else if (part.includes('[]')) {
        const baseName = part.replace('[]', '');
        if (baseName) {
          segments.push(baseName);
        }
      } else {
        segments.push(part);
      }
    }
    
    return segments;
  }

  private traverseAndRedact(
    obj: any,
    parts: string[],
    index: number,
    rule: RedactionRule
  ): void {
    if (index >= parts.length || obj === null || obj === undefined) {
      return;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.traverseAndRedact(item, parts, index, rule);
      }
      return;
    }

    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    const part = parts[index];
    const isLast = index === parts.length - 1;

    if (part === '*') {
      const nextIndex = index + 1;
      const isNextLast = nextIndex === parts.length - 1;
      
      if (isNextLast) {
        const targetKey = parts[nextIndex];
        this.recursiveSearch(obj, targetKey, rule);
      } else {
        for (const key of Object.keys(obj)) {
          this.traverseAndRedact(obj[key], parts, nextIndex, rule);
        }
      }
      return;
    }

    if (isLast) {
      this.redactValue(obj, part, rule);
    } else {
      if (part in obj) {
        this.traverseAndRedact(obj[part], parts, index + 1, rule);
      }
    }
  }

  private recursiveSearch(obj: any, targetKey: string, rule: RedactionRule): void {
    if (obj === null || obj === undefined) {
      return;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.recursiveSearch(item, targetKey, rule);
      }
      return;
    }

    if (typeof obj !== 'object') {
      return;
    }

    for (const key of Object.keys(obj)) {
      if (key === targetKey) {
        this.redactValue(obj, key, rule);
      }
      this.recursiveSearch(obj[key], targetKey, rule);
    }
  }

  private redactValue(obj: any, key: string, rule: RedactionRule): void {
    if (obj === null || typeof obj !== 'object' || !(key in obj)) {
      return;
    }

    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
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
