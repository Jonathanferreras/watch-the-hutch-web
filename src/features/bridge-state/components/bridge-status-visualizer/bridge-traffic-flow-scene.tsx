"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { Color, type Mesh, type MeshStandardMaterial } from "three";

import { BridgeTraffic } from "../../bridge-state.types";
import { TRAFFIC_CONFIG } from "../../bridge-state.constants";

interface BridgeTrafficFlowSceneProps {
    reduceMotion: boolean;
    traffic: {
        northBoundTraffic: BridgeTraffic;
        northBoundTrafficConfidence: number;
        southBoundTraffic: BridgeTraffic;
        southBoundTrafficConfidence: number;
    }
}

export function BridgeTrafficFlowScene({ reduceMotion, traffic }: BridgeTrafficFlowSceneProps) {
    const ROAD_LENGTH = 20;
    const ROAD_WIDTH = 3.5;
    const ROAD_COLOR = "#FFF8F0";
    const ROAD_THICKNESS = 1;
    const GAP_BETWEEN_ROADS = 1.8;
    const TRAFFIC_FLOW_WIDTH = 2.6;
    const { northBoundTraffic, southBoundTraffic } = traffic;

    const northBoundProperties = TRAFFIC_CONFIG[northBoundTraffic];
    const southBoundProperties = TRAFFIC_CONFIG[southBoundTraffic];
    const northBoundEdgeColor = getTrafficEdgeColor(northBoundProperties.color);
    const southBoundEdgeColor = getTrafficEdgeColor(southBoundProperties.color);

    return (
        <div className="h-[350px] w-full rounded-xl overflow-hidden mt-5">
            <Canvas aria-hidden="true" camera={{ position: [0, 5, 8], fov: 45 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} />

                <mesh position={[-GAP_BETWEEN_ROADS, 0, 0]}>
                    <boxGeometry args={[ROAD_WIDTH, ROAD_THICKNESS, ROAD_LENGTH]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>
                <TrafficBand
                    position={[-GAP_BETWEEN_ROADS + 0.2, 0.75, 0]}
                    width={TRAFFIC_FLOW_WIDTH}
                    length={ROAD_LENGTH}
                    color={southBoundProperties.color}
                    edgeColor={southBoundEdgeColor}
                    reduceMotion={reduceMotion}
                />
                <TrafficFlow
                    x={-1.6}
                    length={ROAD_LENGTH}
                    width={TRAFFIC_FLOW_WIDTH}
                    direction="down"
                    speed={southBoundProperties.speed}
                    color={southBoundEdgeColor}
                    reduceMotion={reduceMotion}
                />


                <mesh position={[GAP_BETWEEN_ROADS + 0.2, 0, 0]}>
                    <boxGeometry args={[ROAD_WIDTH, ROAD_THICKNESS, ROAD_LENGTH]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>
                <TrafficBand
                    position={[GAP_BETWEEN_ROADS, 0.75, 0]}
                    width={TRAFFIC_FLOW_WIDTH}
                    length={ROAD_LENGTH}
                    color={northBoundProperties.color}
                    edgeColor={northBoundEdgeColor}
                    reduceMotion={reduceMotion}
                />
                <TrafficFlow
                    x={GAP_BETWEEN_ROADS}
                    length={ROAD_LENGTH}
                    width={TRAFFIC_FLOW_WIDTH}
                    direction="up"
                    speed={northBoundProperties.speed}
                    color={northBoundEdgeColor}
                    reduceMotion={reduceMotion}
                />
            </Canvas>
        </div>
    );
}

interface TrafficBandProps {
    position: [number, number, number];
    width: number;
    length: number;
    color: string;
    edgeColor: string;
    reduceMotion: boolean;
}

function TrafficBand({ position, width, length, color, edgeColor, reduceMotion }: TrafficBandProps) {
    const materialRef = useRef<MeshStandardMaterial>(null);
    const [initialColor] = useState(color);
    const targetColor = useMemo(() => new Color(color), [color]);

    useFrame((_, delta) => {
        if (!materialRef.current || reduceMotion) return;

        const blend = 1 - Math.exp(-delta * 5);
        materialRef.current.color.lerp(targetColor, blend);
        materialRef.current.emissive.lerp(targetColor, blend);
    });

    return (
        <mesh position={position}>
            <boxGeometry args={[width, 0.5, length]} />
            <meshStandardMaterial
                ref={materialRef}
                color={initialColor}
                transparent
                opacity={0.55}
                emissive={initialColor}
                emissiveIntensity={0.25}
            />
            <Edges color={edgeColor} />
        </mesh>
    );
}

interface TrafficFlowProps {
    x: number;
    length: number;
    width: number;
    direction: "up" | "down";
    speed: number;
    color: string;
    reduceMotion: boolean;
}

function TrafficFlow({ x, length, width, direction, speed, color, reduceMotion }: TrafficFlowProps) {
    const ref = useRef<Mesh>(null);
    const materialRef = useRef<MeshStandardMaterial>(null);
    const offsetRef = useRef(0);
    const [initialColor] = useState(color);
    const [initialOpacity] = useState(speed > 0 ? 0.45 : 0);
    const speedRef = useRef(speed);
    const targetColor = useMemo(() => new Color(color), [color]);
    const FLOW_LENGTH = 3;
    const travelDistance = length + FLOW_LENGTH;
    const startingPoint = -travelDistance / 2;

    useFrame((_, delta) => {
        if (reduceMotion) return;

        const blend = 1 - Math.exp(-delta * 5);
        speedRef.current += (speed - speedRef.current) * blend;
        offsetRef.current = (offsetRef.current + speedRef.current * delta) % travelDistance;

        if (ref.current) {
            const offset = offsetRef.current - travelDistance / 2;

            ref.current.position.z = offset * (direction == "up" ? -1 : 1);
        }

        if (materialRef.current) {
            materialRef.current.color.lerp(targetColor, blend);
            materialRef.current.opacity += ((speed > 0 ? 0.45 : 0) - materialRef.current.opacity) * blend;
        }
    });

    return (
        <mesh ref={ref} position={[x, 1, startingPoint]}>
            <boxGeometry args={[width, 0.08, 3]} />
            <meshStandardMaterial
                ref={materialRef}
                color={initialColor}
                transparent
                opacity={initialOpacity}
            />
        </mesh>
    );
}

function getTrafficEdgeColor(color: string) {
    return new Color(color)
        .multiplyScalar(0.7)
        .getStyle();
}
