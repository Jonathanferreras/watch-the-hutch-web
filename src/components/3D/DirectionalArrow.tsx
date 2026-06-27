import { useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";

type DirectionalArrowProps = {
    position: [number, number, number];
    direction: "up" | "down";
    color: string;
};

export function DirectionalArrow({ position, direction, color }: DirectionalArrowProps) {
    const arrowRef = useRef<Group>(null);
    const basePosition = position;
    const directionColor = color;

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