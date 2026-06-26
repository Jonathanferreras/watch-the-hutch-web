"use client";

import { BRIDGE_POSITION, CurrentBridgeState } from "../../bridge-state.types";
import { BridgeTrafficFlowScene } from "./bridge-traffic-flow-scene";
import { BridgeTransitionScene } from "./bridge-transition-scene";
import { BridgeOpenScene } from "./bridge-open-scene";
import { BridgeEstimatedWaitTime } from "./bridge-estimated-wait-time";

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
            case BRIDGE_POSITION.OPEN:
                return (
                    <>
                        <BridgeEstimatedWaitTime
                            elapsedMinutes={2}
                            totalMinutes={20}
                            startedAt="2:14 PM"
                            eta="2:34 PM"
                        />

                        {state.position === BRIDGE_POSITION.OPEN ? (
                            <BridgeOpenScene />
                        ) : (
                            <BridgeTransitionScene
                                bridge={{
                                    position: state.position,
                                    positionConfidence: state.positionConfidence,
                                }}
                            />
                        )}
                    </>
                );

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
