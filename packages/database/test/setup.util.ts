//
// UTILITIES / SETUP
//
/**
 * Forces a database error for testing error handling scenarios
 * @param schema - The database schema to mock
 * @param methodName - The database method to mock
 * @param impl - The implementation that throws the error
 */
import { getInstance } from '@/index';
import { createExecutionContext } from 'cloudflare:test';
import { vi } from 'vitest';

type Ctx = ReturnType<typeof createExecutionContext>;

export const forceDBError = (ctx: Ctx, methodName: string, impl: () => any) => {
  const instance = getInstance(ctx);
  if (!instance) throw new Error('Context instance not found');

  if (methodName in instance.db) {
    // @ts-expect-error - We're intentionally mocking the method
    const property = instance.db[methodName] as unknown;
    if (typeof property === 'function') {
      // @ts-expect-error - We're intentionally mocking the method
      vi.spyOn(instance.db, methodName).mockImplementation(impl as any);
    }
  }
};
