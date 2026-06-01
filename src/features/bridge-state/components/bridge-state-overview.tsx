import { BRIDGE_POSITION, BridgePosition } from "../bridge-state.types"

interface BridgeStateOverviewProps {
    state: {
        position: BridgePosition
    }
}

export function BridgeStateOverview({ state }: BridgeStateOverviewProps) {
    const { position } = state;
    const { color, statusColor } = BridgeStateVisuals[position];

    const renderStatusMessage = () => {
        switch (position) {
            case BRIDGE_POSITION.CLOSED:
                return "Normal Operation"
            case BRIDGE_POSITION.OPENING:
            case BRIDGE_POSITION.CLOSING:
                return "Please wait..."

            case BRIDGE_POSITION.OPEN:
                return "Boat Crossing"

            case BRIDGE_POSITION.UNKNOWN:
                return "Status Unavailable"
            default:
                return null;
        }
    }

    return (
        <div className="flex flex-col justify-center items-center">
            <div className="flex justify-center items-center mt-10">
                {position !== BRIDGE_POSITION.UNKNOWN && <span className="animate-pulse inline-block h-4 w-4 rounded-full mr-2" style={{ backgroundColor: statusColor }}></span>}
                <h1 className="text-center font-bold text-xl" style={{ color }}>BRIDGE {position.toUpperCase()}</h1>
            </div>
            <div>
                <p className="text-gray-500">{renderStatusMessage()}</p>
            </div>
        </div>
    )
}

const BridgeStateVisuals: Record<BridgePosition, { color: string, statusColor?: string }> = {
    closed: {
        color: "#329579ff",
        statusColor: "#38caa1ff"
    },
    opening: {
        color: "#F97316",
        statusColor: "#ff8d3bff"

    },
    open: {
        color: "#EF4444",
        statusColor: "#ff5858ff"
    },
    closing: {
        color: "#F97316",
        statusColor: "#ff8d3bff"
    },
    unknown: {
        color: "#9CA3AF",
    },

}