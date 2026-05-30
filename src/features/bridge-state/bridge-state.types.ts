export const CURRENT_BRIDGE_STATE_ID = "current";

export const BRIDGE_POSITIONS = [
  "closed",
  "opening",
  "open",
  "closing",
  "unknown",
] as const;

export const BRIDGE_TRAFFIC_STATES = [
  "light",
  "moderate",
  "heavy",
  "standstill",
  "unknown",
] as const;

export const BRIDGE_STATE_SOURCES = ["device", "admin"] as const;

export type BridgePosition = (typeof BRIDGE_POSITIONS)[number];

export type BridgeTraffic = (typeof BRIDGE_TRAFFIC_STATES)[number];

export type BridgeStateSource = (typeof BRIDGE_STATE_SOURCES)[number];

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

  traffic: BridgeTraffic;
  trafficConfidence: number;

  acceptsDeviceUpdates: boolean;

  updatedAt: Date;
};

export type CurrentBridgeStatePayload = {
  sourceId: string;
  sourceType: BridgeStateSource;

  position: BridgePosition;
  positionConfidence: number;

  traffic: BridgeTraffic;
  trafficConfidence: number;

  acceptsDeviceUpdates: boolean;
};
