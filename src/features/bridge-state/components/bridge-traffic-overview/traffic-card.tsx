import { BridgeTraffic } from "../../bridge-state.types";

interface TrafficCardProps {
    direction: "NorthBound" | "SouthBound";
    intensity: BridgeTraffic;
    confidence: number;
}

export function TrafficCard({ direction, intensity, confidence }: TrafficCardProps) {
    const trafficVisual = BridgeTrafficVisuals[intensity];
    const confidenceVisual = getConfidenceVisual(confidence);
    const confidenceIcon = ConfidenceVisuals[confidenceVisual.level];
    const title =
        direction === "NorthBound"
            ? "Hutchinson River Pkwy North"
            : "Hutchinson River Pkwy South";
    const directionArrow = direction === "NorthBound" ? "↑" : "↓";

    return (
        <div className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-slate-900/10 ring-1 ring-black/5 backdrop-blur-md">
            <div className="flex items-start gap-4">
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-semibold"
                    style={{
                        backgroundColor: `${trafficVisual.color}1A`,
                        color: trafficVisual.color,
                    }}
                >
                    {directionArrow}
                </div>

                <div className="min-w-0 flex-1">
                    <div>
                        <h3 className="text-sm font-semibold leading-5 text-slate-950">
                            {title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Traffic Intensity
                        </p>
                    </div>

                    <p
                        className="mt-3 text-2xl font-bold capitalize leading-none"
                        style={{ color: trafficVisual.color }}
                    >
                        {intensity}
                    </p>

                    <div className="mt-4 flex w-fit gap-1.5">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-2.5 w-10 rounded-full"
                                style={{
                                    backgroundColor:
                                        index < trafficVisual.level
                                            ? trafficVisual.color
                                            : "#e5e7eb",
                                }}
                            />
                        ))}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                        <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${confidenceIcon.backgroundColor} ${confidenceIcon.textColor}`}
                        >
                            {confidenceIcon.icon}
                        </span>

                        <span
                            className={`font-medium ${confidenceVisual.textColor}`}
                        >
                            {confidenceVisual.label}
                        </span>

                        <span className="text-slate-400">•</span>

                        <span className="text-slate-500">
                            {Math.round(confidence * 100)}% confidence
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

type ConfidenceLevel =
    | "verified"
    | "high"
    | "likely"
    | "uncertain"
    | "unknown";

function getConfidenceVisual(confidence: number): {
    level: ConfidenceLevel;
    label: string;
    textColor: string;
} {
    if (confidence >= 0.9) {
        return {
            level: "verified",
            label: "Verified",
            textColor: "text-emerald-700",
        };
    }

    if (confidence >= 0.75) {
        return {
            level: "high",
            label: "High",
            textColor: "text-green-700",
        };
    }

    if (confidence >= 0.5) {
        return {
            level: "likely",
            label: "Likely",
            textColor: "text-amber-700",
        };
    }

    if (confidence >= 0.25) {
        return {
            level: "uncertain",
            label: "Uncertain",
            textColor: "text-orange-700",
        };
    }

    return {
        level: "unknown",
        label: "Unknown",
        textColor: "text-slate-500",
    };
}

const ConfidenceVisuals: Record<
    ConfidenceLevel,
    {
        icon: string;
        textColor: string;
        backgroundColor: string;
    }
> = {
    verified: {
        icon: "✓",
        textColor: "text-emerald-700",
        backgroundColor: "bg-emerald-100",
    },
    high: {
        icon: "●",
        textColor: "text-green-700",
        backgroundColor: "bg-green-100",
    },
    likely: {
        icon: "~",
        textColor: "text-amber-700",
        backgroundColor: "bg-amber-100",
    },
    uncertain: {
        icon: "!",
        textColor: "text-orange-700",
        backgroundColor: "bg-orange-100",
    },
    unknown: {
        icon: "?",
        textColor: "text-slate-500",
        backgroundColor: "bg-slate-100",
    },
};

const BridgeTrafficVisuals: Record<
    BridgeTraffic,
    {
        color: string;
        level: number;
    }
> = {
    light: {
        color: "#21D19F",
        level: 1,
    },
    moderate: {
        color: "#FACC15",
        level: 2,
    },
    heavy: {
        color: "#F97316",
        level: 3,
    },
    standstill: {
        color: "#EF4444",
        level: 4,
    },
    unknown: {
        color: "#9CA3AF",
        level: 0,
    },
};