"use client";

import { BRIDGE_POSITION, CurrentBridgeState } from "../../bridge-state.types";
import { BridgeTrafficFlowScene } from "./bridge-traffic-flow-scene";
import { BridgeTransitionScene } from "./bridge-transition-scene";
import { BridgeOpenScene } from "./bridge-open-scene";
import { useBridgeState } from "../../hooks/use-bridge-state";

export function BridgeStatusVisualizer({ state }: { state: CurrentBridgeState }) {
    const { data } = useBridgeState();

    if (state.position === BRIDGE_POSITION.CLOSED && data?.traffic) {
        return <BridgeTrafficFlowScene traffic={data.traffic} />
    } else if (state.position === BRIDGE_POSITION.OPENING || state.position === BRIDGE_POSITION.CLOSING) {
        return <BridgeTransitionScene />
    } else if (state.position === BRIDGE_POSITION.OPEN) {
        return <BridgeOpenScene />
    } else {
        return (<></>);
    }
}