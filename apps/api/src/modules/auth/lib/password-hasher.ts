import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

const KEY_LENGTH_BYTES = 64;
const SALT_LENGTH_BYTES = 16;
const DEFAULT_SCRYPT_PARAMS: ScryptParams = { N: 16384, r: 8, p: 1 };

export class PasswordHasher {
  constructor(private readonly params: ScryptParams = DEFAULT_SCRYPT_PARAMS) {}

  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH_BYTES);
    const key = await this.derive(password, salt, this.params);
    const { N, r, p } = this.params;
    return ['scrypt', N, r, p, salt.toString('base64url'), key.toString('base64url')].join('$');
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [scheme, N, r, p, salt, key] = stored.split('$');
    const params = { N: Number(N), r: Number(r), p: Number(p) };
    if (
      scheme !== 'scrypt' ||
      !salt ||
      !key ||
      !Object.values(params).every(Number.isSafeInteger)
    ) {
      return false;
    }

    const expected = Buffer.from(key, 'base64url');
    const actual = await this.derive(password, Buffer.from(salt, 'base64url'), params);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private derive(password: string, salt: Buffer, { N, r, p }: ScryptParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, KEY_LENGTH_BYTES, { N, r, p }, (err, key) =>
        err ? reject(err) : resolve(key),
      );
    });
  }
}
