import { ERROR_CODES } from '@courtly/shared';
import type { Role, UserDto } from '@courtly/shared';
import type { Request, RequestHandler } from 'express';
import { AppError } from '../../http/errors';
import { SESSION_COOKIE } from './lib/session-cookie';
import type { TokenSigner } from './lib/token-signer';
import type { UsersRepository } from './repository';
import { toUserDto } from './service';

export interface AuthGuards {
  requireAuth: RequestHandler;
  requireRole: (...roles: Role[]) => RequestHandler;
}

const unauthenticated = () => new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required');

export function authUser(req: Request): UserDto {
  if (!req.user) throw unauthenticated();
  return req.user;
}

export function createAuthGuards({
  users,
  tokenSigner,
}: {
  users: UsersRepository;
  tokenSigner: TokenSigner;
}): AuthGuards {
  const requireAuth: RequestHandler = async (req, _res, next) => {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const token = cookies?.[SESSION_COOKIE];
    const userId = typeof token === 'string' ? await tokenSigner.verify(token) : null;
    const user = userId === null ? null : await users.findById(userId);
    if (!user) throw unauthenticated();

    req.user = toUserDto(user);
    next();
  };

  const requireRole =
    (...roles: Role[]): RequestHandler =>
    (req, _res, next) => {
      if (!roles.includes(authUser(req).role)) {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have access to this resource');
      }
      next();
    };

  return { requireAuth, requireRole };
}
