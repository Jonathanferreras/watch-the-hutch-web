"use client";

import { useEffect, useState } from "react";
import {
    getBridgeDataSource,
    setBridgeDataSource,
    subscribeToDataSource,
} from "../bridge-state.store";

export function BridgeDataSourceToggle() {
    const [source, setSource] = useState(getBridgeDataSource());

    useEffect(() => {
        return subscribeToDataSource(setSource);
    }, []);

    const switchToLive = () => setBridgeDataSource("live");
    const switchToLocal = () => setBridgeDataSource("local");

    return (
        <div className="p-4 rounded-xl border bg-white shadow-sm">
            <div className="text-sm font-semibold mb-3">
                Data Source
            </div>

            <div className="flex gap-2">
                <button
                    onClick={switchToLive}
                    className={`px-3 py-2 rounded-lg text-sm ${source === "live"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100"
                        }`}
                >
                    Live (Firebase)
                </button>

                <button
                    onClick={switchToLocal}
                    className={`px-3 py-2 rounded-lg text-sm ${source === "local"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100"
                        }`}
                >
                    Local (Demo)
                </button>
            </div>

            <div className="text-xs text-gray-500 mt-2">
                {source === "live"
                    ? "Using real-time production data"
                    : "Using local demo data (safe to edit)"}
            </div>
        </div>
    );
}