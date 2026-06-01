"use client";

import { CurrentBridgeState } from "../../bridge-state.types";
import { BridgeTrafficFlowScene } from "./bridge-traffic-flow-scene";
import { BridgeTransitionScene } from "./bridge-transition-scene";
import { BridgeOpenScene } from "./bridge-open-scene";
import { useBridgeState } from "../../hooks/use-bridge-state";

export function BridgeStatusVisualizer({ state }: { state: CurrentBridgeState }) {
    const { data } = useBridgeState();

    if (state.position === "closed" && data?.traffic) {
        return <BridgeTrafficFlowScene traffic={data.traffic} />
    } else if (state.position === "opening" || state.position === "closing") {
        return <BridgeTransitionScene />
    } else if (state.position === "open") {
        return <BridgeOpenScene />
    } else {
        return (<></>);
    }
}