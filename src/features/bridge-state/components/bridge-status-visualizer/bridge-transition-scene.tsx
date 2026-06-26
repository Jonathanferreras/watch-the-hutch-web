import { useRef } from "react";
import { Edges } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Color, Group } from "three";

import { TRAFFIC_CONFIG } from "../../bridge-state.constants";
import { BRIDGE_POSITION, BridgePosition } from "../../bridge-state.types";

interface BridgeTransitionSceneProps {
    bridge: {
        position: BridgePosition;
        positionConfidence: number;
    }
}

export function BridgeTransitionScene({ bridge }: BridgeTransitionSceneProps) {
    const bridgeDirection = bridge.position === BRIDGE_POSITION.OPENING ? "up" : "down";
    const xPosition = 2;
    const xPositionOffset = xPosition - 5;
    const yPositionLeaf = 1.7;
    const yPositionRoad = 0;

    const ROAD_LENGTH = 5
    const ROAD_WIDTH = 3.5
    const ROAD_COLOR = "#FFF8F0"
    const TRAFFIC_FLOW_WIDTH = ROAD_WIDTH - 1;
    const TRAFFIC_FLOW_HEIGHT = 0.4;

    const EdgeColor = new Color(TRAFFIC_CONFIG.standstill.color)
        .multiplyScalar(0.7)
        .getStyle();

    return (
        <div className="flex flex-col h-[220px] w-full rounded-xl overflow-hidden mt-5">
            <Canvas camera={{ position: [12, 6, 10], fov: 45 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} />

                {/* Bridge 1 */}
                {/** Start Road far right */}
                <mesh position={[xPosition, yPositionRoad, -9]}>
                    <boxGeometry args={[ROAD_WIDTH, 0.35, ROAD_LENGTH]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>

                <mesh position={[xPosition, yPositionRoad + 0.25, -9]}>
                    <boxGeometry args={[TRAFFIC_FLOW_WIDTH, TRAFFIC_FLOW_HEIGHT, ROAD_LENGTH]} />
                    <meshStandardMaterial
                        color={TRAFFIC_CONFIG.standstill.color}
                        transparent
                        opacity={0.55}
                        emissive={TRAFFIC_CONFIG.standstill.color}
                        emissiveIntensity={0.25}
                    />
                    <Edges color={EdgeColor} />
                </mesh>

                <mesh
                    position={[xPosition, yPositionLeaf, -4.8]}
                    rotation={[-Math.PI / 4, 0, 0]}
                >
                    <boxGeometry args={[3.5, 0.35, 5]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>
                {/** End Road far right */}


                {/** Start Road far bottom left */}
                <mesh
                    position={[xPosition, yPositionLeaf, 1.2]}
                    rotation={[Math.PI / 4, 0, 0]}
                >
                    <boxGeometry args={[3.5, 0.35, 5]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>


                <mesh position={[xPosition, yPositionRoad, 5]}>
                    <boxGeometry args={[ROAD_WIDTH, 0.35, ROAD_LENGTH]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>

                <mesh position={[xPosition, yPositionRoad + 0.25, 5]}>
                    <boxGeometry args={[TRAFFIC_FLOW_WIDTH, TRAFFIC_FLOW_HEIGHT, ROAD_LENGTH]} />
                    <meshStandardMaterial
                        color={TRAFFIC_CONFIG.standstill.color}
                        transparent
                        opacity={0.55}
                        emissive={TRAFFIC_CONFIG.standstill.color}
                        emissiveIntensity={0.25}
                    />
                    <Edges color={EdgeColor} />
                </mesh>
                {/** End Road far bottom left */}


                {/* Bridge 2 */}
                <mesh position={[xPositionOffset, yPositionRoad, -9]}>
                    <boxGeometry args={[ROAD_WIDTH, 0.35, ROAD_LENGTH]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>

                <mesh position={[xPositionOffset, yPositionRoad + 0.25, -9]}>
                    <boxGeometry args={[TRAFFIC_FLOW_WIDTH, TRAFFIC_FLOW_HEIGHT, ROAD_LENGTH]} />
                    <meshStandardMaterial
                        color={TRAFFIC_CONFIG.standstill.color}
                        transparent
                        opacity={0.55}
                        emissive={TRAFFIC_CONFIG.standstill.color}
                        emissiveIntensity={0.25}
                    />
                    <Edges color={EdgeColor} />
                </mesh>

                <mesh
                    position={[xPositionOffset, yPositionLeaf, -4.8]}
                    rotation={[-Math.PI / 4, 0, 0]}
                >
                    <boxGeometry args={[3.5, 0.35, 5]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>

                <mesh
                    position={[xPositionOffset, yPositionLeaf, 1.2]}
                    rotation={[Math.PI / 4, 0, 0]}
                >
                    <boxGeometry args={[3.5, 0.35, 5]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>


                <mesh position={[xPositionOffset, yPositionRoad, 5]}>
                    <boxGeometry args={[ROAD_WIDTH, 0.35, ROAD_LENGTH]} />
                    <meshStandardMaterial color={ROAD_COLOR} />
                </mesh>

                <mesh position={[xPositionOffset, yPositionRoad + 0.25, 5]}>
                    <boxGeometry args={[TRAFFIC_FLOW_WIDTH, TRAFFIC_FLOW_HEIGHT, ROAD_LENGTH]} />
                    <meshStandardMaterial
                        color={TRAFFIC_CONFIG.standstill.color}
                        transparent
                        opacity={0.55}
                        emissive={TRAFFIC_CONFIG.standstill.color}
                        emissiveIntensity={0.25}
                    />
                    <Edges color={EdgeColor} />
                </mesh>
                <FloatingArrow direction={bridgeDirection} />
            </Canvas>
        </div>
    );
}

type FloatingArrowProps = {
    direction: "up" | "down";
};

function FloatingArrow({ direction }: FloatingArrowProps) {
    const arrowRef = useRef<Group>(null);
    const basePosition: [number, number, number] = [4, 0, -2.5];
    const directionColor = "#F8F272";

    useFrame(({ clock }) => {
        if (!arrowRef.current) return;

        const arrowMovementSpeed = Math.sin(clock.elapsedTime * 5)
        const arrowMovementDistance = 0.45;

        arrowRef.current.position.y = basePosition[1] + arrowMovementSpeed * arrowMovementDistance;
    });

    return (
        <group
            ref={arrowRef}
            position={basePosition}
            rotation={[0, 0, direction === "up" ? 0 : Math.PI]}
            scale={3}
        >
            <group position={[0, -0.575, 0]}>
                {/* shaft */}
                <mesh position={[0, 0.35, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.7, 24]} />
                    <meshStandardMaterial
                        color={directionColor}
                        emissive={directionColor}
                        emissiveIntensity={0.25}
                    />
                </mesh>

                {/* arrow head */}
                <mesh position={[0, 0.9, 0]}>
                    <coneGeometry args={[0.25, 0.45, 24]} />
                    <meshStandardMaterial
                        color={directionColor}
                        emissive={directionColor}
                        emissiveIntensity={0.25}
                    />
                </mesh>
            </group>
        </group>
    );
}