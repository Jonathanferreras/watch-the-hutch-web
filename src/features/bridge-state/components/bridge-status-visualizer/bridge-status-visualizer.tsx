"use client";

import { useEffect, useRef, useState } from "react";

import { useBridgeStateExperience } from "../bridge-state-experience-context";
import { BRIDGE_POSITION, type CurrentBridgeState } from "../../bridge-state.types";
import { BridgeTrafficFlowScene } from "./bridge-traffic-flow-scene";
import { BridgeTransitionScene } from "./bridge-transition-scene";
import { BridgeOpenScene } from "./bridge-open-scene";
import { BridgeEstimatedWaitTimeStatus } from "./bridge-estimated-wait-time";

const SCENE_FADE_DURATION = 260;

export function BridgeStatusVisualizer() {
    const state = useBridgeStateExperience();
    const latestState = useRef(state);
    const [displayedState, setDisplayedState] = useState(state);
    const [isSceneVisible, setIsSceneVisible] = useState(true);

    const sceneKey = state?.position;
    const displayedSceneKey = displayedState?.position;

    const renderScene = (currentState: CurrentBridgeState | null) => {
        if (!currentState) {
            return <div className="text-center">Loading bridge data...</div>;
        }

        switch (currentState.position) {
            case BRIDGE_POSITION.CLOSED:
                const { northBoundTraffic, northBoundTrafficConfidence, southBoundTraffic, southBoundTrafficConfidence } = currentState;

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
                return currentState.position === BRIDGE_POSITION.OPEN ? (
                    <BridgeOpenScene />
                ) : (
                    <BridgeTransitionScene
                        bridge={{
                            position: currentState.position,
                            positionConfidence: currentState.positionConfidence,
                        }}
                    />
                );

            default:
                return null;
        }
    };

    useEffect(() => {
        latestState.current = state;

        if (sceneKey === displayedSceneKey) {
            return;
        }

        const fadeScene = requestAnimationFrame(() => setIsSceneVisible(false));
        const swapScene = window.setTimeout(() => {
            setDisplayedState(latestState.current);

            requestAnimationFrame(() => setIsSceneVisible(true));
        }, SCENE_FADE_DURATION);

        return () => {
            cancelAnimationFrame(fadeScene);
            window.clearTimeout(swapScene);
        };
    }, [state, sceneKey, displayedSceneKey]);

    const currentSceneState = sceneKey === displayedSceneKey ? state : displayedState;
    const estimatedWaitTime = state?.estimatedWaitTime;

    return (
        <section className="h-[350px] overflow-hidden">
            {estimatedWaitTime && <BridgeEstimatedWaitTimeStatus waitTime={estimatedWaitTime} />}

            <div
                className="transition-opacity ease-in-out"
                style={{
                    opacity: isSceneVisible ? 1 : 0,
                    transitionDuration: `${SCENE_FADE_DURATION}ms`,
                }}
            >
                {renderScene(currentSceneState)}
            </div>
        </section>
    );
}
