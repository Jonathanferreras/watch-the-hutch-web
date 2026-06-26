interface BridgeEstimatedWaitTimeProps {
    elapsedMinutes: number;
    totalMinutes: number;
    startedAt: string;
    eta: string;
}

export function BridgeEstimatedWaitTime({
    elapsedMinutes,
    totalMinutes,
    startedAt,
    eta,
}: BridgeEstimatedWaitTimeProps) {
    const remainingMinutes = totalMinutes - elapsedMinutes;
    const progress = (elapsedMinutes / totalMinutes) * 100;

    return (
        <div className="mt-5 ml-auto mr-auto w-[325px]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold text-zinc-900">
                        Estimated Wait Time
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                        {elapsedMinutes} of {totalMinutes} min elapsed
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-3xl font-bold leading-none text-red-500">
                        {remainingMinutes}
                    </p>

                    <p className="text-xs text-zinc-500">
                        min remaining
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
                    <span>Started {startedAt}</span>
                    <span>ETA {eta}</span>
                </div>
            </div>
        </div>
    );
}