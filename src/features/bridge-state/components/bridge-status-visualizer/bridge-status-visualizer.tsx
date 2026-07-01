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
    const reduceMotion = usePrefersReducedMotion();

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
                            reduceMotion={reduceMotion}
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
                    <BridgeOpenScene reduceMotion={reduceMotion} />
                ) : (
                    <BridgeTransitionScene
                        bridge={{
                            position: currentState.position,
                            positionConfidence: currentState.positionConfidence,
                        }}
                        reduceMotion={reduceMotion}
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

        if (reduceMotion) {
            setDisplayedState(latestState.current);
            setIsSceneVisible(true);
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
    }, [state, sceneKey, displayedSceneKey, reduceMotion]);

    const currentSceneState = sceneKey === displayedSceneKey ? state : displayedState;
    const estimatedWaitTime = state?.estimatedWaitTime;
    const summary = getBridgeSceneSummary(state);

    return (
        <section aria-label={summary} className="h-[350px] overflow-hidden">
            <p className="sr-only">{summary}</p>
            {estimatedWaitTime && <BridgeEstimatedWaitTimeStatus waitTime={estimatedWaitTime} />}

            <div
                aria-hidden="true"
                className="transition-opacity ease-in-out motion-reduce:transition-none"
                style={{
                    opacity: isSceneVisible ? 1 : 0,
                    transitionDuration: reduceMotion ? "0ms" : `${SCENE_FADE_DURATION}ms`,
                }}
            >
                {renderScene(currentSceneState)}
            </div>
        </section>
    );
}

function getBridgeSceneSummary(state: CurrentBridgeState | null) {
    if (!state) {
        return "Loading bridge status visualization.";
    }

    if (state.position === BRIDGE_POSITION.CLOSED) {
        return `Northbound traffic is ${state.northBoundTraffic}. Southbound traffic is ${state.southBoundTraffic}.`;
    }

    if (state.position === BRIDGE_POSITION.OPEN) {
        return "Drawbridge is raised. Please wait.";
    }

    if (state.position === BRIDGE_POSITION.OPENING) {
        return "Drawbridge is being raised. Traffic is stopped.";
    }

    if (state.position === BRIDGE_POSITION.CLOSING) {
        return "Traffic should resume shortly.";
    }

    return "Bridge status is unknown.";
}

function usePrefersReducedMotion() {
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => setReduceMotion(mediaQuery.matches);

        updatePreference();
        mediaQuery.addEventListener("change", updatePreference);

        return () => mediaQuery.removeEventListener("change", updatePreference);
    }, []);

    return reduceMotion;
}
