import { z } from "zod";

export const bridgePositionSchema = z.enum([
  "closed",
  "opening",
  "open",
  "closing",
  "unknown",
]);

export const bridgeTrafficSchema = z.enum([
  "light",
  "moderate",
  "heavy",
  "standstill",
  "unknown",
]);

export const bridgeStateSourceSchema = z.enum(["device", "admin"]);

const confidenceSchema = z.number().min(0).max(1);

export const bridgeStateEventSchema = z.object({
  id: z.string().min(1),

  sourceId: z.string().min(1),
  sourceType: bridgeStateSourceSchema,

  position: bridgePositionSchema,
  positionConfidence: confidenceSchema,

  traffic: bridgeTrafficSchema,
  trafficConfidence: confidenceSchema,

  occurredAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export const currentBridgeStateSchema = z.object({
  id: z.literal("current"),

  sourceId: z.string().min(1),
  sourceType: bridgeStateSourceSchema,

  position: bridgePositionSchema,
  positionConfidence: confidenceSchema,

  traffic: bridgeTrafficSchema,
  trafficConfidence: confidenceSchema,

  acceptsDeviceUpdates: z.boolean(),

  updatedAt: z.coerce.date(),
});

export type BridgeStateEventSchema = z.infer<typeof bridgeStateEventSchema>;

export type CurrentBridgeStateSchema = z.infer<typeof currentBridgeStateSchema>;

export const createBridgeStateEventSchema = bridgeStateEventSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateBridgeStateEventInput = z.infer<
  typeof createBridgeStateEventSchema
>;
