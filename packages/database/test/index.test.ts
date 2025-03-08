import { createExecutionContext, env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { initDBInstance } from '../src';

describe('Initialized Database', () => {
  it('Should be initilized without errors', async () => {
    const ctx = createExecutionContext();
    const db = initDBInstance(ctx, env);
    expect(db).toBeDefined();

    const db2 = initDBInstance(ctx, env);
    expect(db2).toBeDefined();
  });
});
