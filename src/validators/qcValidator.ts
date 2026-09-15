import { z } from 'zod';

export const ParsedQCDataSchema = z.object({
  inspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'inspectionDate must be YYYY-MM-DD'),
  inspectionType: z.string().min(1).max(200),
  factory: z.string().min(1).max(100),
  process: z.string().max(200).nullable(),
  jobNumber: z.string().min(1).max(100),
  number: z.number().int().nonnegative().nullable(),
  machineNumber: z.string().max(50).nullable(),
  inspectionTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'inspectionTime must be HH:MM')
    .nullable(),
  qcCheck: z.string().max(500).nullable(),
  qcResult: z.string().max(50).nullable(),
  status: z.string().max(50).nullable(),
  originalStatus: z.string().max(50).nullable(),
});

export type ValidatedQCData = z.infer<typeof ParsedQCDataSchema>;

export const QcFilterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  factory: z.string().max(100).optional(),
  jobNumber: z.string().max(100).optional(),
  machineNumber: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  inspectionType: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type QcFilter = z.infer<typeof QcFilterSchema>;

export const TelegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z
    .object({
      message_id: z.number(),
      chat: z.object({ id: z.number(), type: z.string().optional(), title: z.string().optional() }),
      from: z
        .object({ id: z.number(), username: z.string().optional(), first_name: z.string().optional() })
        .optional(),
      text: z.string().optional(),
      caption: z.string().optional(),
      date: z.number().optional(),
    })
    .optional(),
  channel_post: z
    .object({
      message_id: z.number(),
      chat: z.object({ id: z.number(), title: z.string().optional() }),
      text: z.string().optional(),
      caption: z.string().optional(),
      date: z.number().optional(),
    })
    .optional(),
});
