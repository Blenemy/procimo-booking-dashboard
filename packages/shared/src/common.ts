import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const isoDateSchema = z.iso.date();

export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const dateQuerySchema = z.object({
  date: isoDateSchema,
});
export type DateQuery = z.infer<typeof dateQuerySchema>;
