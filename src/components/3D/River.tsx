import { useRef } from "react";
import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

interface RiverProps {
    position: [number, number, number];
    width: number;
    height: number;
    length: number;
    color: string;
    edgeColor: string;
}

export function River({
    position,
    width,
    height,
    length,
    color,
    edgeColor,
}: RiverProps) {
    const waterMovementRef = useRef<Group>(null);

    useFrame(({ clock }) => {
        if (!waterMovementRef.current) return;

        waterMovementRef.current.position.x =
            Math.sin(clock.elapsedTime * 0.6) * 0.35;
    });

    return (
        <group position={position}>
            {/* Base river */}
            <mesh rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[width, height, length]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.8}
                    emissive={color}
                    emissiveIntensity={0.25}
                />
                <Edges color={edgeColor} />
            </mesh>

            {/* Water movement */}
            <group ref={waterMovementRef} position={[0, height / 2 + 0.05, 0]}>
                {[-6, -4, -2, 0, 2, 4, 6].map((z, index) => (
                    <mesh
                        key={z}
                        position={[index % 2 === 0 ? -3 : 3, 0, z]}
                        rotation={[0, Math.PI, 0]}
                    >
                        <boxGeometry args={[1.8, 0.03, 0.08]} />
                        <meshStandardMaterial
                            color="#DDF4FF"
                            transparent
                            opacity={0.45}
                            emissive="#DDF4FF"
                            emissiveIntensity={0.2}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}