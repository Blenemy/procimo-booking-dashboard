import { ERROR_CODES } from '@courtly/shared';
import type { UserDto } from '@courtly/shared';
import type { User } from '../../generated/prisma/client';
import { AppError } from '../../http/errors';
import type { PasswordHasher } from './lib/password-hasher';
import type { TokenSigner } from './lib/token-signer';
import type { UsersRepository } from './repository';

export const toUserDto = (user: User): UserDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});

export function createAuthService({
  users,
  passwordHasher,
  tokenSigner,
}: {
  users: UsersRepository;
  passwordHasher: PasswordHasher;
  tokenSigner: TokenSigner;
}) {
  let dummyHash: Promise<string> | undefined;
  const hashForUnknownUser = () => (dummyHash ??= passwordHasher.hash('timing-equalizer'));

  return {
    async login(email: string, password: string): Promise<{ user: UserDto; token: string }> {
      const user = await users.findByEmail(email);
      const valid = await passwordHasher.verify(
        password,
        user?.passwordHash ?? (await hashForUnknownUser()),
      );
      if (!user || !valid) {
        throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');
      }
      return { user: toUserDto(user), token: await tokenSigner.sign(user.id) };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
