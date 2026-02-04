import { describe, it } from "@std/bdd";
import { expect } from "@std/expect";

import Redactor from '~/tracer/services/redactor.service.ts';
import type { TraceType } from '~/tracer/types.ts';
import SpanKindEnum from '~/tracer/enums/span-kind.enum.ts';
import SpanStatusEnum from '~/tracer/enums/span-status.enum.ts';

describe('Redactor', () => {
  describe('Basic Redaction', () => {
    it('should mask specific attribute fields', () => {
      const redactor = new Redactor([
        {
          paths: ['attributes.password', 'attributes.apiKey'],
          action: 'mask',
          replacement: '***REDACTED***'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          username: 'user123',
          password: 'secret123',
          apiKey: 'key-abc-xyz',
          email: 'user@example.com'
        }
      };

      const redacted = redactor.redact(trace);

      expect(redacted.attributes?.username).toBe('user123');
      expect(redacted.attributes?.email).toBe('user@example.com');
      expect(redacted.attributes?.password).toBe('***REDACTED***');
      expect(redacted.attributes?.apiKey).toBe('***REDACTED***');
    });

    it('should remove specific fields', () => {
      const redactor = new Redactor([
        {
          paths: ['attributes.creditCard'],
          action: 'remove'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          username: 'user123',
          creditCard: '4111-1111-1111-1111'
        }
      };

      const redacted = redactor.redact(trace);

      expect(redacted.attributes?.username).toBe('user123');
      expect('creditCard' in (redacted.attributes || {})).toBe(false);
    });

    it('should hash specific fields', () => {
      const redactor = new Redactor([
        {
          paths: ['attributes.email'],
          action: 'hash'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          email: 'user@example.com'
        }
      };

      const redacted = redactor.redact(trace);

      expect(typeof redacted.attributes?.email).toBe('string');
      expect((redacted.attributes?.email as string).startsWith('[HASH:')).toBe(true);
      expect(redacted.attributes?.email).not.toBe('user@example.com');
    });
  });

  describe('Wildcard Redaction', () => {
    it('should redact fields using top-level wildcard pattern *.password', () => {
      const redactor = new Redactor([
        {
          paths: ['*.password'],
          action: 'mask',
          replacement: '[SECRET]'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          username: 'user123',
          password: 'attr-secret'
        }
      };

      const redacted = redactor.redact(trace);

      // Should redact password in attributes
      expect(redacted.attributes?.username).toBe('user123');
      expect(redacted.attributes?.password).toBe('[SECRET]');
    });

    it('should redact fields using wildcard pattern attributes.*.password', () => {
      const redactor = new Redactor([
        {
          paths: ['attributes.*.password'],
          action: 'mask'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          user: {
            username: 'user123',
            password: 'secret123'
          },
          admin: {
            username: 'admin456',
            password: 'admin-secret'
          },
          config: {
            timeout: 5000
          }
        }
      };

      const redacted = redactor.redact(trace);

      expect((redacted.attributes?.user as any)?.username).toBe('user123');
      expect((redacted.attributes?.user as any)?.password).toBe('[REDACTED]');
      expect((redacted.attributes?.admin as any)?.username).toBe('admin456');
      expect((redacted.attributes?.admin as any)?.password).toBe('[REDACTED]');
      expect((redacted.attributes?.config as any)?.timeout).toBe(5000);
    });

    it('should redact multiple wildcard patterns', () => {
      const redactor = new Redactor([
        {
          paths: ['attributes.*.apiKey', 'attributes.*.secret'],
          action: 'mask',
          replacement: '***'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          service1: {
            name: 'api-service',
            apiKey: 'key-123'
          },
          service2: {
            name: 'auth-service',
            secret: 'secret-456'
          }
        }
      };

      const redacted = redactor.redact(trace);

      expect((redacted.attributes?.service1 as any)?.name).toBe('api-service');
      expect((redacted.attributes?.service1 as any)?.apiKey).toBe('***');
      expect((redacted.attributes?.service2 as any)?.name).toBe('auth-service');
      expect((redacted.attributes?.service2 as any)?.secret).toBe('***');
    });
  });

  describe('Array Entry Redaction', () => {
    it('should redact fields in entry data', () => {
      const redactor = new Redactor([
        {
          paths: ['entries[].data.password'],
          action: 'mask'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [
          {
            type: 'event',
            name: 'login',
            timestamp: Date.now(),
            data: {
              username: 'user123',
              password: 'secret123'
            }
          },
          {
            type: 'log',
            level: 1,
            message: 'Test log',
            timestamp: Date.now(),
            data: {
              action: 'test',
              password: 'another-secret'
            }
          }
        ]
      };

      const redacted = redactor.redact(trace);

      expect(redacted.entries[0].data?.username).toBe('user123');
      expect(redacted.entries[0].data?.password).toBe('[REDACTED]');
      expect(redacted.entries[1].data?.action).toBe('test');
      expect(redacted.entries[1].data?.password).toBe('[REDACTED]');
    });

    it('should redact using wildcard in entries', () => {
      const redactor = new Redactor([
        {
          paths: ['entries[].data.*.token'],
          action: 'remove'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [
          {
            type: 'event',
            name: 'api-call',
            timestamp: Date.now(),
            data: {
              service1: {
                url: 'https://api1.com',
                token: 'token-123'
              },
              service2: {
                url: 'https://api2.com',
                token: 'token-456'
              }
            }
          }
        ]
      };

      const redacted = redactor.redact(trace);

      expect((redacted.entries[0].data?.service1 as any)?.url).toBe('https://api1.com');
      expect('token' in ((redacted.entries[0].data?.service1 as any) || {})).toBe(false);
      expect((redacted.entries[0].data?.service2 as any)?.url).toBe('https://api2.com');
      expect('token' in ((redacted.entries[0].data?.service2 as any) || {})).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested arrays and objects', () => {
      const redactor = new Redactor([
        {
          paths: [
            '*.password',
            'attributes.data.*.email',
            'attributes.data.*.more.*.test'
          ],
          action: 'mask',
          replacement: '[HIDDEN]'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          data: [
            {
              user: { name: 'Alice', password: 'secret1' },
              admin: { name: 'Bob', password: 'secret2' }
            },
            [
              { password: 'secret3', email: 'test@example.com' },
              { name: 'Charlie' }
            ],
            {
              nested: {
                deep: [
                  { password: 'secret4' }
                ],
                more: {
                  ahahah: {
                    test: 'should be hidden',
                    info: 'should stay'
                  },
                  test: {
                    notAnError: 'should stay'
                  }
                }
              }
            }
          ]
        }
      };

      const redacted = redactor.redact(trace);

      // Array items that are objects with password
      expect((redacted.attributes?.data as any)[0].user.password).toBe('[HIDDEN]');
      expect((redacted.attributes?.data as any)[0].admin.password).toBe('[HIDDEN]');
      expect((redacted.attributes?.data as any)[0].user.name).toBe('Alice');

      // Nested array within array
      expect((redacted.attributes?.data as any)[1][0].password).toBe('[HIDDEN]');
      expect((redacted.attributes?.data as any)[1][0].email).toBe('[HIDDEN]');

      // Deeply nested
      expect((redacted.attributes?.data as any)[2].nested.deep[0].password).toBe('[HIDDEN]');
      
      // Check that 'test' property inside 'more.ahahah' is redacted
      expect((redacted.attributes?.data as any)[2].nested.more.ahahah.test).toBe('[HIDDEN]');
      
      // Check that properties that should NOT be redacted remain unchanged
      expect((redacted.attributes?.data as any)[2].nested.more.ahahah.info).toBe('should stay');
      expect((redacted.attributes?.data as any)[2].nested.more.test.notAnError).toBe('should stay');
    });

    it('should handle arrays at any level without explicit [] in path', () => {
      const redactor = new Redactor([
        {
          paths: ['attributes.items.token'],
          action: 'remove'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          items: [
            { id: 1, token: 'token1' },
            { id: 2, token: 'token2' },
            [
              { id: 3, token: 'token3' }
            ]
          ]
        }
      };

      const redacted = redactor.redact(trace);

      expect('token' in ((redacted.attributes?.items as any)[0] || {})).toBe(false);
      expect('token' in ((redacted.attributes?.items as any)[1] || {})).toBe(false);
      expect('token' in ((redacted.attributes?.items as any)[2][0] || {})).toBe(false);
      expect((redacted.attributes?.items as any)[0].id).toBe(1);
      expect((redacted.attributes?.items as any)[1].id).toBe(2);
    });

    it('should handle missing attributes', () => {
      const redactor = new Redactor([
        {
          paths: ['attributes.password'],
          action: 'mask'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: []
      };

      const redacted = redactor.redact(trace);
      expect(redacted.attributes).toBeUndefined();
    });

    it('should handle non-existent paths', () => {
      const redactor = new Redactor([
        {
          paths: ['attributes.nonexistent.field'],
          action: 'mask'
        }
      ]);

      const trace: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          username: 'user123'
        }
      };

      const redacted = redactor.redact(trace);
      expect(redacted.attributes?.username).toBe('user123');
    });

    it('should not mutate original trace', () => {
      const redactor = new Redactor([
        {
          paths: ['attributes.password'],
          action: 'mask'
        }
      ]);

      const original: TraceType = {
        id: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        kind: SpanKindEnum.INTERNAL,
        status: SpanStatusEnum.UNSET,
        startTime: Date.now(),
        entries: [],
        attributes: {
          password: 'secret123'
        }
      };

      const redacted = redactor.redact(original);

      expect(original.attributes?.password).toBe('secret123');
      expect(redacted.attributes?.password).toBe('[REDACTED]');
    });
  });
});
