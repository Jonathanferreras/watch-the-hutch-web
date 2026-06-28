import { useEffect, useState } from "react";
import { BridgeEstimatedWaitTime } from "../../bridge-state.types";

interface BridgeEstimatedWaitTimeProps {
    waitTime: BridgeEstimatedWaitTime
}

export function BridgeEstimatedWaitTimeStatus({ waitTime }: BridgeEstimatedWaitTimeProps) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNow(Date.now());
        }, 60000);

        return () => window.clearInterval(intervalId);
    }, []);

    const {
        displayedRemainingMinutes,
        estimatedTotalMinutes,
        startedAt,
        visualProgressPercent,
    } = waitTime;

    if (!startedAt || !estimatedTotalMinutes) {
        return null;
    }

    const startedAtDate = new Date(startedAt);
    const elapsedMinutes = Math.floor((now - startedAtDate.getTime()) / 60000);
    const remainingMinutes =
        displayedRemainingMinutes ?? Math.max(0, estimatedTotalMinutes - elapsedMinutes);
    const progress =
        visualProgressPercent ?? Math.min(100, (elapsedMinutes / estimatedTotalMinutes) * 100);

    const started = startedAtDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const eta = new Date(
        startedAtDate.getTime() + estimatedTotalMinutes * 60000
    ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });


    return (
        <div className="mt-5 ml-auto mr-auto w-[325px]">
            <div className="flex items-start justify-between">
                <div className="mt-auto mb-auto">
                    <p className="text-lg font-semibold text-zinc-900">
                        Estimated Wait Time
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-3xl font-bold leading-none text-red-500">
                        {remainingMinutes}<span className="text-sm text-zinc-500"> min</span>
                    </p>
                </div>
            </div>

            <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-red-100">
                    <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                    <span>Started {started}</span>
                    <span>ETA {eta}</span>
                </div>
            </div>
        </div>
    );
}
