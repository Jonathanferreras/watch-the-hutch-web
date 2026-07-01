import { Canvas } from "@react-three/fiber";

import { BRIDGE_POSITION, BridgePosition } from "../../bridge-state.types";
import { Bridge } from "@/src/components/3D/Bridge";
import { DirectionalArrow } from "@/src/components/3D/DirectionalArrow";

interface BridgeTransitionSceneProps {
    bridge: {
        position: BridgePosition;
        positionConfidence: number;
    };
    reduceMotion: boolean;
}

export function BridgeTransitionScene({ bridge, reduceMotion }: BridgeTransitionSceneProps) {
    const bridgeDirection = bridge.position === BRIDGE_POSITION.OPENING ? "up" : "down";

    return (
        <div className="flex flex-col h-[220px] w-full rounded-xl overflow-hidden mt-5">
            <Canvas aria-hidden="true" camera={{ position: [12, 6, 10], fov: 35 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <Bridge
                    xPosition={2}
                    xPositionOffset={-3}
                    yPositionLeaf={1.7}
                    raisedLeafZ={-4.8}
                    loweredLeafZ={1.2}
                    raisedLeafRotation={-Math.PI / 4}
                    loweredLeafRotation={Math.PI / 4}
                />
                <DirectionalArrow
                    position={[4, 0, -2.5]}
                    direction={bridgeDirection}
                    color={"#F8F272"}
                    reduceMotion={reduceMotion}
                />
            </Canvas>
        </div>
    );
}
