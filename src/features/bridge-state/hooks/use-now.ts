import { useEffect, useState } from "react";

/** The current time in milliseconds, refreshed every `intervalMs`. */
export const useNow = (intervalMs = 60000) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(Date.now()), intervalMs);

        return () => window.clearInterval(intervalId);
    }, [intervalMs]);

    return now;
};
