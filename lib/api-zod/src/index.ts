import { z } from 'zod/v4';

export const RequestPairingBody = z.object({
  number: z.string(),
});

export const RequestPairingResponse = z.object({
  success: z.boolean(),
  pairingCode: z.string(),
  sessionId: z.string(),
  message: z.string(),
});

export const GetPairingStatusResponse = z.object({
  sessionId: z.string(),
  status: z.string(),
  connected: z.boolean(),
  deploySessionId: z.string().nullable(),
});
