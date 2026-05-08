export type BridgePosition =
  | "closed"
  | "opening"
  | "open"
  | "closing"
  | "unknown";

export type BridgeTraffic =
  | "light"
  | "moderate"
  | "heavy"
  | "standstill"
  | "unknown";

export type BridgeStateSource = "device" | "admin";

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
  id: "current";

  sourceId: string;
  sourceType: BridgeStateSource;

  position: BridgePosition;
  positionConfidence: number;

  traffic: BridgeTraffic;
  trafficConfidence: number;

  acceptsDeviceUpdates: boolean;

  updatedAt: Date;
};
