import { z } from "zod";

import type { AuthCredentials, AuthSessionPayload } from "./auth.types";

export const authCredentialsSchema = z.object({
  email: z.email(),
  password: z.string(),
}) satisfies z.ZodType<AuthCredentials>;

export const authSessionPayloadSchema = z.object({
  token: z.string(),
}) satisfies z.ZodType<AuthSessionPayload>;

export type AuthCredentialsSchema = z.infer<typeof authCredentialsSchema>;

export type AuthSessionPayloadSchema = z.infer<typeof authSessionPayloadSchema>;
