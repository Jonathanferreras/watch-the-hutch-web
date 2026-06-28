"use client";

import { useBridgeStateExperience } from "../bridge-state-experience-context";
import { BRIDGE_POSITION } from "../../bridge-state.types";
import { BridgeTrafficFlowScene } from "./bridge-traffic-flow-scene";
import { BridgeTransitionScene } from "./bridge-transition-scene";
import { BridgeOpenScene } from "./bridge-open-scene";
import { BridgeEstimatedWaitTimeStatus } from "./bridge-estimated-wait-time";

export function BridgeStatusVisualizer() {
    const state = useBridgeStateExperience();

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
                const { estimatedWaitTime } = state;

                return (
                    <>
                        {estimatedWaitTime && <BridgeEstimatedWaitTimeStatus waitTime={estimatedWaitTime} />}

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
