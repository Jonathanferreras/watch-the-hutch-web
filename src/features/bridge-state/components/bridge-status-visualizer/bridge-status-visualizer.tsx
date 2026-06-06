"use client";

import { BRIDGE_POSITION, CurrentBridgeState } from "../../bridge-state.types";
import { BridgeTrafficFlowScene } from "./bridge-traffic-flow-scene";
import { BridgeTransitionScene } from "./bridge-transition-scene";
import { BridgeOpenScene } from "./bridge-open-scene";

interface BridgeStatusVisualizerProps {
    state: CurrentBridgeState;
}

export function BridgeStatusVisualizer({ state }: BridgeStatusVisualizerProps) {

    if (!state) {
        return <div className="text-center">Loading bridge data...</div>;
    }

    const renderScene = () => {
        switch (state.position) {
            case BRIDGE_POSITION.CLOSED:
                const { northBoundTraffic, northBoundTrafficConfidence, southBoundTraffic, southBoundTrafficConfidence } = state;

                if (northBoundTraffic && southBoundTraffic) {
                    return (
                        <BridgeTrafficFlowScene
                            traffic={{
                                northBoundTraffic,
                                northBoundTrafficConfidence,
                                southBoundTraffic,
                                southBoundTrafficConfidence
                            }}
                        />
                    );
                }
                return null;

            case BRIDGE_POSITION.OPENING:
            case BRIDGE_POSITION.CLOSING:
                return <BridgeTransitionScene />;

            case BRIDGE_POSITION.OPEN:
                return <BridgeOpenScene />;

            default:
                return null;
        }
    };

    return (
        <section className="h-[350px]">
            {renderScene()}
        </section>
    );
}
