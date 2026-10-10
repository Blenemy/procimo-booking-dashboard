import type { UserDto } from '@courtly/shared';

declare global {
  namespace Express {
    interface Request {
      user?: UserDto;
    }
  }
}

export {};
