import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
    writeBatch,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/db";
import {
    BRIDGE_STATE_COLLECTION,
    EVENTS_COLLECTION,
} from "@/src/lib/firebase/collections";
import { BridgeEstimatedWaitTime, CURRENT_BRIDGE_STATE_ID, CurrentBridgeState } from "../bridge-state.types";
import { BridgeStateRepository } from "../bridge-state.repository";
import { logError } from "@/src/lib/errors";

const toDate = (value: Date | { toDate?: () => Date } | null | undefined) => {
    if (!value) return null;

    return value instanceof Date ? value : value.toDate?.() ?? null;
};

const normalizeEstimatedWaitTime = (
    waitTime: BridgeEstimatedWaitTime | null | undefined
): BridgeEstimatedWaitTime | null => {
    if (!waitTime) return null;

    return {
        ...waitTime,
        startedAt: toDate(waitTime.startedAt) ?? new Date(),
        lastRevisedAt: toDate(waitTime.lastRevisedAt),
        updatedAt: toDate(waitTime.updatedAt) ?? new Date(),
    };
};

type StoredBridgeState = Omit<CurrentBridgeState, "updatedAt" | "acceptsDeviceUpdates"> & {
    acceptsDeviceUpdates?: boolean;
    updatedAt?: { toDate?: () => Date };
};

// The edge device writes this document too (sourceType "device"). It never writes
// acceptsDeviceUpdates, so a document it created has none: that means "accepting".
const normalizeBridgeState = (data: StoredBridgeState): CurrentBridgeState => ({
    ...data,
    acceptsDeviceUpdates: data.acceptsDeviceUpdates ?? true,
    estimatedWaitTime: normalizeEstimatedWaitTime(data.estimatedWaitTime),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
});

const currentRef = () => doc(db, BRIDGE_STATE_COLLECTION, CURRENT_BRIDGE_STATE_ID);

export const firebaseBridgeStateRepository: BridgeStateRepository = {
    async getCurrentBridgeState() {
        try {
            const snap = await getDoc(currentRef());

            if (!snap.exists()) return null;

            const data = snap.data() as StoredBridgeState | undefined;

            if (!data) return null;

            return normalizeBridgeState(data);
        } catch (error) {
            logError("FirebaseRepo", "Failed to fetch bridge state", error);
            throw error;
        }
    },

    subscribeToBridgeState(callback, onError) {
        return onSnapshot(
            currentRef(),
            (snap) => {
                if (!snap.exists()) {
                    callback(null);
                    return;
                }

                callback(normalizeBridgeState(snap.data() as StoredBridgeState));
            },
            (error) => {
                onError?.(error);
            }
        );
    },

    async updateCurrentBridgeState(update) {
        try {
            const batch = writeBatch(db);

            const eventRef = doc(collection(db, EVENTS_COLLECTION));

            // set with merge, not update: the document may not exist yet on a fresh project.
            batch.set(
                currentRef(),
                {
                    ...update,
                    id: CURRENT_BRIDGE_STATE_ID,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );

            batch.set(eventRef, {
                id: eventRef.id,
                sourceId: update.sourceId,
                sourceType: update.sourceType,

                position: update.position,
                positionConfidence: update.positionConfidence,

                northBoundTraffic: update.northBoundTraffic,
                northBoundTrafficConfidence:
                    update.northBoundTrafficConfidence,

                southBoundTraffic: update.southBoundTraffic,
                southBoundTrafficConfidence:
                    update.southBoundTrafficConfidence,

                occurredAt: serverTimestamp(),
                createdAt: serverTimestamp(),
            });

            await batch.commit();
        } catch (error) {
            logError("FirebaseRepo", "Failed to update bridge state", error);
            throw error;
        }
    },

    async setAcceptsDeviceUpdates(accepts) {
        try {
            // Leaves updatedAt alone: it says when the shown state was last written.
            await setDoc(currentRef(), { acceptsDeviceUpdates: accepts }, { merge: true });
        } catch (error) {
            logError("FirebaseRepo", "Failed to change device updates", error);
            throw error;
        }
    },
};
