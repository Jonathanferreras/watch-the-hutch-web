import { z } from "zod";
import { AuthCredentials, AuthSessionPayload } from "./auth.types";

const authCredentialsSchema = z.object({
  email: z.email(),
  password: z.string(),
}) satisfies z.ZodType<AuthCredentials>;

const authSessionPayloadSchema = z.object({
  token: z.string(),
}) satisfies z.ZodType<AuthSessionPayload>;

export type AuthCredentialsSchema = z.infer<typeof authCredentialsSchema>;

export type AuthSessionPayloadSchema = z.infer<typeof authSessionPayloadSchema>;
