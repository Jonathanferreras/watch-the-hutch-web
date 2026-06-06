export const CURRENT_BRIDGE_STATE_ID = "current";

export const BRIDGE_POSITION = {
  CLOSED: "closed",
  OPENING: "opening",
  OPEN: "open",
  CLOSING: "closing",
  UNKNOWN: "unknown",
} as const;

export const BRIDGE_TRAFFIC = {
  LIGHT: "light",
  MODERATE: "moderate",
  HEAVY: "heavy",
  STANDSTILL: "standstill",
  UNKNOWN: "unknown",
} as const;

export const BRIDGE_STATE_SOURCE = {
  DEVICE: "device",
  ADMIN: "admin",
} as const;

export type ConfidenceLevel =
  | "verified"
  | "high"
  | "likely"
  | "uncertain"
  | "unknown";

export type TrafficDirection = "NorthBound" | "SouthBound";

export const BRIDGE_POSITIONS = Object.values(BRIDGE_POSITION);
export const BRIDGE_TRAFFIC_STATES = Object.values(BRIDGE_TRAFFIC);
export const BRIDGE_STATE_SOURCES = Object.values(BRIDGE_STATE_SOURCE);

export type BridgePosition =
  (typeof BRIDGE_POSITION)[keyof typeof BRIDGE_POSITION];

export type BridgeTraffic =
  (typeof BRIDGE_TRAFFIC)[keyof typeof BRIDGE_TRAFFIC];

export type BridgeStateSource =
  (typeof BRIDGE_STATE_SOURCE)[keyof typeof BRIDGE_STATE_SOURCE];

export type BridgeStateEvent = {
  id: string;
  sourceId: string;
  sourceType: BridgeStateSource;

  position: BridgePosition;
  positionConfidence: number;

  traffic: BridgeTraffic;
  trafficConfidence: number;

  occurredAt: Date;
  createdAt: Date;
};

export type CurrentBridgeState = {
  id: typeof CURRENT_BRIDGE_STATE_ID;

  sourceId: string;
  sourceType: BridgeStateSource;

  position: BridgePosition;
  positionConfidence: number;

  northBoundTraffic: BridgeTraffic;
  northBoundTrafficConfidence: number;

  southBoundTraffic: BridgeTraffic;
  southBoundTrafficConfidence: number;

  acceptsDeviceUpdates: boolean;

  updatedAt: Date;
};

export type CurrentBridgeStatePayload = {
  sourceId: string;
  sourceType: BridgeStateSource;

  position: BridgePosition;
  positionConfidence: number;

  northBoundTraffic: BridgeTraffic;
  northBoundTrafficConfidence: number;

  southBoundTraffic: BridgeTraffic;
  southBoundTrafficConfidence: number;

  acceptsDeviceUpdates: boolean;
};
