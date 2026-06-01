"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei"
import { Color, type Mesh } from "three";

import { BridgeTraffic } from "../../bridge-state.types";

interface BridgeTrafficFlowSceneProps {
    traffic: {
        northBound: BridgeTraffic;
        southBound: BridgeTraffic
    }
}

export function BridgeTrafficFlowScene({ traffic }: BridgeTrafficFlowSceneProps) {
    const ROAD_LENGTH = 20;
    const ROAD_WIDTH = 3.5;
    const ROAD_COLOR = "#FFF8F0";
    const ROAD_THICKNESS = 1;
    const GAP_BETWEEN_ROADS = 1.8;
    const TRAFFIC_FLOW_WIDTH = 2.6;
    const { northBound, southBound } = traffic;

    const northBoundProperties = TrafficFlowVisuals[northBound];
    const northBoundEdgeColor = new Color(northBoundProperties.color)
        .multiplyScalar(0.7)
        .getStyle()
    const southBoundProperties = TrafficFlowVisuals[southBound];
    const southBoundEdgeColor = new Color(southBoundProperties.color)
        .multiplyScalar(0.7)
        .getStyle()

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden mt-5">
            <Canvas camera={{ position: [0, 5, 8], fov: 45 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} />

                {/* Left road */}
                <mesh position={[-GAP_BETWEEN_ROADS, 0, 0]}>
                    <boxGeometry args={[ROAD_WIDTH, ROAD_THICKNESS, ROAD_LENGTH]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>
                {/* Left traffic flow */}
                <mesh position={[-GAP_BETWEEN_ROADS + 0.2, 0.75, 0]}>
                    <boxGeometry args={[TRAFFIC_FLOW_WIDTH, 0.5, ROAD_LENGTH]} />
                    <meshStandardMaterial
                        color={northBoundProperties.color}
                        transparent
                        opacity={0.55}
                        emissive={northBoundProperties.color}
                        emissiveIntensity={0.25}
                    />
                    <Edges color={northBoundEdgeColor} />
                </mesh>
                {northBoundProperties.speed > 0 && <TrafficFlow
                    x={-1.6}
                    length={ROAD_LENGTH}
                    width={TRAFFIC_FLOW_WIDTH}
                    direction="down"
                    speed={northBoundProperties.speed}
                    color={northBoundEdgeColor}
                />}


                {/* Right road */}
                <mesh position={[GAP_BETWEEN_ROADS + 0.2, 0, 0]}>
                    <boxGeometry args={[ROAD_WIDTH, ROAD_THICKNESS, ROAD_LENGTH]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>
                {/* Right traffic flow */}
                <mesh position={[GAP_BETWEEN_ROADS, 0.75, 0]}>
                    <boxGeometry args={[TRAFFIC_FLOW_WIDTH, 0.5, ROAD_LENGTH]} />

                    <meshStandardMaterial
                        color={southBoundProperties.color}
                        transparent
                        opacity={0.55}
                        emissive={southBoundProperties.color}
                        emissiveIntensity={0.25}
                    />
                    <Edges color={southBoundEdgeColor} />
                </mesh>
                {southBoundProperties.speed > 0 && <TrafficFlow
                    x={GAP_BETWEEN_ROADS}
                    length={ROAD_LENGTH}
                    width={TRAFFIC_FLOW_WIDTH}
                    direction="up"
                    speed={southBoundProperties.speed}
                    color={southBoundEdgeColor}
                />}
            </Canvas>
        </div>
    )
}

interface TrafficFlowProps {
    x: number;
    length: number;
    width: number;
    direction: "up" | "down";
    speed: number;
    color: string;
}

function TrafficFlow({ x, length, width, direction, speed, color }: TrafficFlowProps) {
    const ref = useRef<Mesh>(null);
    const FLOW_LENGTH = 3;
    const travelDistance = length + FLOW_LENGTH;
    const startingPoint = -travelDistance / 2;

    useFrame((state) => {
        if (!ref.current) return;

        const time = state.clock.elapsedTime;
        const offset = ((time * speed) % (travelDistance)) - (travelDistance) / 2;

        ref.current.position.z = offset * (direction == "up" ? -1 : 1)

    });

    return (
        <mesh ref={ref} position={[x, 1, startingPoint]}>
            <boxGeometry args={[width, 0.08, 3]} />
            <meshStandardMaterial
                color={color}
                transparent
                opacity={0.45}
            />
        </mesh>
    );
}

const TrafficFlowVisuals: Record<BridgeTraffic, { speed: number, color: string }> = {
    light: {
        speed: 15,
        color: "#21D19F",
    },
    moderate: {
        speed: 5,
        color: "#FACC15",
    },
    heavy: {
        speed: 2,
        color: "#F97316",
    },
    standstill: {
        speed: 0,
        color: "#EF4444",
    },
    unknown: {
        speed: 0,
        color: "#9CA3AF",
    },

}