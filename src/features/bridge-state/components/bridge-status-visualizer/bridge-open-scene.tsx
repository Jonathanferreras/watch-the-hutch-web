import { Canvas } from "@react-three/fiber";
import { Color } from "three";

import { Bridge } from "@/src/components/3D/Bridge";
import { TugBoat } from "@/src/components/3D/TugBoat";
import { River } from "@/src/components/3D/River";

interface BridgeOpenSceneProps {
    reduceMotion: boolean;
}

export function BridgeOpenScene({ reduceMotion }: BridgeOpenSceneProps) {
    const RIVER_COLOR = "#6BB6FF";
    const BOAT_COLOR = "#7dc191";

    const RiverEdgeColor = new Color(RIVER_COLOR)
        .multiplyScalar(0.7)
        .getStyle();

    return (
        <div className="flex flex-col h-[220px] w-full rounded-xl overflow-hidden mt-5">
            <Canvas aria-hidden="true" shadows camera={{ position: [26, 24, 17], fov: 15 }}>
                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[20, 25, 15]}
                    intensity={1.5}
                    castShadow
                />
                <Bridge
                    xPosition={2}
                    xPositionOffset={-2.5}
                    yPositionLeaf={2.7}
                    raisedLeafZ={-6.3}
                    loweredLeafZ={2.4}
                    raisedLeafRotation={-Math.PI / 2}
                    loweredLeafRotation={Math.PI / 2}
                />
                <River
                    position={[-0.5, -1.2, -2]}
                    width={12}
                    height={0.8}
                    length={40}
                    color={RIVER_COLOR}
                    edgeColor={RiverEdgeColor}
                />
                <TugBoat
                    position={[1.5, -0.5, -2]}
                    color={BOAT_COLOR}
                    animations={reduceMotion ? undefined : {
                        rockingSpeed: 1.2,
                        rockingAmount: 0.1,
                        driftAmount: 1.25
                    }}
                />
            </Canvas>
        </div>
    );
}
