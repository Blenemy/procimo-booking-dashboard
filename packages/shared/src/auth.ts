import { z } from 'zod';
import { PASSWORD_MAX_LENGTH } from './constants';
import type { Role } from './constants';

export const loginRequestSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface UserDto {
  id: number;
  email: string;
  name: string;
  role: Role;
}
