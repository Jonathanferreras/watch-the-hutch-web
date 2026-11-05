import { useState } from "react";

import { bridgeStateService } from "../bridge-state.service";
import { useAuthContext } from "../../auth/components/auth-provider";
import { toError } from "@/src/lib/errors";

/** Hands the live bridge state back to the edge device after an admin override. */
export const useDeviceUpdates = () => {
    const { user } = useAuthContext();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const setAcceptsDeviceUpdates = async (accepts: boolean) => {
        if (!user?.uid) {
            throw new Error("You must be logged in to change device updates.");
        }

        setSaving(true);
        setError(null);

        try {
            await bridgeStateService.setAcceptsDeviceUpdates(accepts);
        } catch (error) {
            setError(toError(error, "Device updates change error."));
        } finally {
            setSaving(false);
        }
    };

    return { setAcceptsDeviceUpdates, saving, error };
};
