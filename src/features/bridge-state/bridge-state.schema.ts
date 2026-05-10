import { z } from "zod";
import {
  BRIDGE_POSITIONS,
  BRIDGE_STATE_SOURCES,
  BRIDGE_TRAFFIC_STATES,
  CURRENT_BRIDGE_STATE_ID,
  BridgePosition,
  BridgeStateEvent,
  BridgeStateSource,
  BridgeTraffic,
  CurrentBridgeState,
} from "./bridge-state.types";

const bridgePositionSchema = z.enum(
  BRIDGE_POSITIONS,
) satisfies z.ZodType<BridgePosition>;

const bridgeTrafficSchema = z.enum(
  BRIDGE_TRAFFIC_STATES,
) satisfies z.ZodType<BridgeTraffic>;

const bridgeStateSourceSchema = z.enum(
  BRIDGE_STATE_SOURCES,
) satisfies z.ZodType<BridgeStateSource>;

const confidenceSchema = z.number().min(0).max(1);

const dateSchema = z.preprocess((value) => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  return value;
}, z.coerce.date());

const bridgeStateEventSchema = z.object({
  id: z.string().min(1),

  sourceId: z.string().min(1),
  sourceType: bridgeStateSourceSchema,

  position: bridgePositionSchema,
  positionConfidence: confidenceSchema,

  traffic: bridgeTrafficSchema,
  trafficConfidence: confidenceSchema,

  occurredAt: dateSchema,
  createdAt: dateSchema,
}) satisfies z.ZodType<BridgeStateEvent>;

export const currentBridgeStateSchema = z.object({
  id: z.literal(CURRENT_BRIDGE_STATE_ID),

  sourceId: z.string().min(1),
  sourceType: bridgeStateSourceSchema,

  position: bridgePositionSchema,
  positionConfidence: confidenceSchema,

  traffic: bridgeTrafficSchema,
  trafficConfidence: confidenceSchema,

  acceptsDeviceUpdates: z.boolean(),

  updatedAt: dateSchema,
}) satisfies z.ZodType<CurrentBridgeState>;

export const bridgeStateDeviceUpdatesToggleSchema = z.object({
  acceptsDeviceUpdates: z.boolean(),
});

export type CurrentBridgeStateSchema = z.infer<typeof currentBridgeStateSchema>;

export const bridgeStateEventCreateSchema = bridgeStateEventSchema.omit({
  id: true,
});

export const createBridgeStateEventSchema = bridgeStateEventSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateBridgeStateEventInput = z.infer<
  typeof createBridgeStateEventSchema
>;

export type BridgeStateEventCreate = z.infer<
  typeof bridgeStateEventCreateSchema
>;

export type BridgeStateDeviceUpdatesToggleInput = z.infer<
  typeof bridgeStateDeviceUpdatesToggleSchema
>;
