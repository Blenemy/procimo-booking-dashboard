import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { TokenSigner } from '../src/modules/auth/lib/token-signer';

const SECRET = 'unit-test-secret-that-is-at-least-32-chars';
const signer = new TokenSigner(SECRET, 1);

describe('TokenSigner', () => {
  it('round-trips the user id', async () => {
    expect(await signer.verify(await signer.sign(42))).toBe(42);
  });

  it('rejects a token signed with a different secret', async () => {
    const other = new TokenSigner('another-secret-that-is-at-least-32-chars', 1);

    expect(await signer.verify(await other.sign(42))).toBeNull();
  });

  it('rejects a token whose subject is not a user id', async () => {
    const token = await new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('admin')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(SECRET));

    expect(await signer.verify(token)).toBeNull();
  });
});
