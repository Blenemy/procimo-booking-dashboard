import { SignJWT, jwtVerify } from 'jose';

export class TokenSigner {
  private readonly key: Uint8Array;

  constructor(
    secret: string,
    private readonly ttlHours: number,
  ) {
    this.key = new TextEncoder().encode(secret);
  }

  sign(userId: number): Promise<string> {
    return new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(userId))
      .setIssuedAt()
      .setExpirationTime(`${this.ttlHours}h`)
      .sign(this.key);
  }

  async verify(token: string): Promise<number | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ['HS256'] });
      const userId = Number(payload.sub);
      return Number.isInteger(userId) && userId > 0 ? userId : null;
    } catch {
      return null;
    }
  }
}
