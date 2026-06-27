import { Edges } from "@react-three/drei";
import { Color } from "three";

import { TRAFFIC_CONFIG } from "@/src/features/bridge-state/bridge-state.constants";

interface BridgeProps {
    xPosition?: number;
    xPositionOffset?: number;
    yPositionLeaf?: number;
    yPositionRoad?: number;
    raisedLeafZ?: number;
    loweredLeafZ?: number;
    raisedLeafRotation?: number;
    loweredLeafRotation?: number;
}

export function Bridge({
    xPosition = 2,
    xPositionOffset = -3,
    yPositionLeaf = 1.7,
    yPositionRoad = 0,
    raisedLeafZ = -4.8,
    loweredLeafZ = 1.2,
    raisedLeafRotation = -Math.PI / 4,
    loweredLeafRotation = Math.PI / 4,
}: BridgeProps) {
    const ROAD_LENGTH = 5;
    const ROAD_WIDTH = 3.5;
    const ROAD_COLOR = "#FFF8F0";
    const TRAFFIC_FLOW_WIDTH = ROAD_WIDTH - 1;
    const TRAFFIC_FLOW_HEIGHT = 0.4;

    const edgeColor = new Color(TRAFFIC_CONFIG.standstill.color)
        .multiplyScalar(0.7)
        .getStyle();

    const renderBridgeSide = (x: number) => (
        <>
            <mesh castShadow receiveShadow position={[x, yPositionRoad, -9]}>
                <boxGeometry args={[ROAD_WIDTH, 0.35, ROAD_LENGTH]} />
                <meshStandardMaterial color={ROAD_COLOR} />
            </mesh>

            <mesh castShadow receiveShadow position={[x, yPositionRoad + 0.25, -9]}>
                <boxGeometry args={[TRAFFIC_FLOW_WIDTH, TRAFFIC_FLOW_HEIGHT, ROAD_LENGTH]} />
                <meshStandardMaterial
                    color={TRAFFIC_CONFIG.standstill.color}
                    transparent
                    opacity={0.55}
                    emissive={TRAFFIC_CONFIG.standstill.color}
                    emissiveIntensity={0.25}
                />
                <Edges color={edgeColor} />
            </mesh>

            <mesh
                castShadow
                receiveShadow
                position={[x, yPositionLeaf, raisedLeafZ]}
                rotation={[raisedLeafRotation, 0, 0]}
            >
                <boxGeometry args={[ROAD_WIDTH, 0.35, ROAD_LENGTH]} />
                <meshStandardMaterial color={ROAD_COLOR} />
            </mesh>

            <mesh
                castShadow
                receiveShadow
                position={[x, yPositionLeaf, loweredLeafZ]}
                rotation={[loweredLeafRotation, 0, 0]}
            >
                <boxGeometry args={[ROAD_WIDTH, 0.35, ROAD_LENGTH]} />
                <meshStandardMaterial color={ROAD_COLOR} />
            </mesh>

            <mesh castShadow receiveShadow position={[x, yPositionRoad, 5]}>
                <boxGeometry args={[ROAD_WIDTH, 0.35, ROAD_LENGTH]} />
                <meshStandardMaterial color={ROAD_COLOR} />
            </mesh>

            <mesh castShadow receiveShadow position={[x, yPositionRoad + 0.25, 5]}>
                <boxGeometry args={[TRAFFIC_FLOW_WIDTH, TRAFFIC_FLOW_HEIGHT, ROAD_LENGTH]} />
                <meshStandardMaterial
                    color={TRAFFIC_CONFIG.standstill.color}
                    transparent
                    opacity={0.55}
                    emissive={TRAFFIC_CONFIG.standstill.color}
                    emissiveIntensity={0.25}
                />
                <Edges color={edgeColor} />
            </mesh>
        </>
    );

    return (
        <group>
            {renderBridgeSide(xPosition)}
            {renderBridgeSide(xPositionOffset)}
        </group>
    );
}