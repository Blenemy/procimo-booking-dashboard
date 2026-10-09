import type { z } from 'zod';

export const parse = <S extends z.ZodType>(schema: S, value: unknown): z.output<S> =>
  schema.parse(value);
