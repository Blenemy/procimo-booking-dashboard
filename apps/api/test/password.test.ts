import { describe, expect, it } from 'vitest';
import { PasswordHasher } from '../src/modules/auth/lib/password-hasher';

const hasher = new PasswordHasher();

describe('PasswordHasher', () => {
  it('verifies the original password and rejects others', async () => {
    const hash = await hasher.hash('correct horse');

    expect(hash).not.toContain('correct horse');
    expect(await hasher.verify('correct horse', hash)).toBe(true);
    expect(await hasher.verify('wrong horse', hash)).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hasher.hash('same')).not.toBe(await hasher.hash('same'));
  });

  it('rejects malformed stored hashes instead of throwing', async () => {
    expect(await hasher.verify('x', '')).toBe(false);
    expect(await hasher.verify('x', 'bcrypt$whatever')).toBe(false);
    expect(await hasher.verify('x', 'scrypt$abc$8$1$c2FsdA$a2V5')).toBe(false);
  });
});
