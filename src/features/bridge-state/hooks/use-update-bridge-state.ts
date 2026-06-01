import { useState } from "react";

import { bridgeStateService } from "../bridge-state.service";
import { BridgePosition, BridgeTraffic } from "../bridge-state.types";
import { useAuthContext } from "../../auth/components/auth-provider";
import { toError } from "@/src/lib/errors";

interface UpdateBridgeStateParams {
    position: BridgePosition;
    northBoundTraffic: BridgeTraffic;
    southBoundTraffic: BridgeTraffic;

}

export const useUpdateBridgeState = () => {
    const { user } = useAuthContext();
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const updateBridgeState = async ({ position, northBoundTraffic, southBoundTraffic }: UpdateBridgeStateParams) => {
        if (!user?.uid) {
            throw new Error("You must be logged in to update bridge state.");
        }

        setUpdating(true);
        setError(null);

        try {
            await bridgeStateService.updateCurrentBridgeState({
                position,
                positionConfidence: 1.0,
                northBoundTraffic,
                northBoundTrafficConfidence: 1.0,
                southBoundTraffic,
                southBoundTrafficConfidence: 1.0,
                sourceId: user.uid,
                sourceType: "admin",
                acceptsDeviceUpdates: false,
            });
        } catch (error) {
            setError(toError(error, "Bridge state update error."));
            throw error;
        } finally {
            setUpdating(false);
        }
    }

    return {
        updateBridgeState,
        updating,
        error,
    };
};
