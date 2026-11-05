import { DEVICE_STALE_AFTER_MINUTES } from "./bridge-state.constants";
import { BRIDGE_POSITION, BRIDGE_STATE_SOURCE, BRIDGE_TRAFFIC, CurrentBridgeState } from "./bridge-state.types";

export type DisplayedBridgeState = {
    state: CurrentBridgeState;
    /** Minutes since the device last wrote, when that is too long ago to trust; otherwise null. */
    staleMinutes: number | null;
};

/**
 * What the public page shows. A device state that has gone stale is shown as unknown rather
 * than as a bridge position that may have changed since. Admin states never go stale: an
 * admin override stands until someone changes it.
 */
export const getDisplayedBridgeState = (state: CurrentBridgeState, now: number): DisplayedBridgeState => {
    if (state.sourceType !== BRIDGE_STATE_SOURCE.DEVICE) {
        return { state, staleMinutes: null };
    }

    const ageMinutes = Math.floor((now - state.updatedAt.getTime()) / 60000);

    if (ageMinutes < DEVICE_STALE_AFTER_MINUTES) {
        return { state, staleMinutes: null };
    }

    return {
        state: {
            ...state,
            position: BRIDGE_POSITION.UNKNOWN,
            positionConfidence: 0,
            northBoundTraffic: BRIDGE_TRAFFIC.UNKNOWN,
            northBoundTrafficConfidence: 0,
            southBoundTraffic: BRIDGE_TRAFFIC.UNKNOWN,
            southBoundTrafficConfidence: 0,
            estimatedWaitTime: null,
        },
        staleMinutes: ageMinutes,
    };
};

export const formatStaleNotice = (minutes: number) => {
    const ago = minutes < 120 ? `${minutes} minutes` : `${Math.floor(minutes / 60)} hours`;

    return `The bridge camera hasn't reported for ${ago}, so the current state is unknown.`;
};
