import { useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";

interface TugBoatProps {
    position: [number, number, number];
    color: string;
    animations?: {
        rockingSpeed?: number;
        rockingAmount?: number;
        driftAmount?: number;
    }
}

export function TugBoat({ position, color = "#eeeeee", animations }: TugBoatProps) {
    const ref = useRef<Group>(null);

    useFrame(({ clock }) => {

        if (!ref.current) return;

        if (animations) {
            const { rockingSpeed, rockingAmount, driftAmount } = animations;

            if (rockingSpeed && rockingAmount) {
                ref.current.rotation.x = Math.sin(clock.elapsedTime * rockingSpeed) * rockingAmount;
            }

            if (driftAmount) {
                ref.current.position.x = 1.5 + Math.sin(clock.elapsedTime * 0.4) * driftAmount;
            }
        }
    });

    return (
        <group
            ref={ref}

            position={position}
            rotation={[0, Math.PI, 0]}
            scale={2.5}
        >
            {/* Hull */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.8, 0.5, 0.8]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Bow */}
            <mesh
                position={[0.95, 0.05, 0]}
                rotation={[0, Math.PI / 4, 0]}
            >
                <boxGeometry args={[0.5, 0.45, 0.5]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Cabin */}
            <mesh position={[-0.2, 0.45, 0]}>
                <boxGeometry args={[0.7, 0.45, 0.6]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Roof */}
            <mesh position={[-0.2, 0.75, 0]}>
                <boxGeometry args={[0.35, 0.25, 0.35]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Smokestack */}
            <mesh position={[-0.65, 0.65, 0]}>
                <cylinderGeometry
                    args={[0.08, 0.08, 0.4]}
                />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    );
}