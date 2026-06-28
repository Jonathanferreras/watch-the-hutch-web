import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
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

export const firebaseBridgeStateRepository: BridgeStateRepository = {
    async getCurrentBridgeState() {
        try {
            const docRef = doc(
                db,
                BRIDGE_STATE_COLLECTION,
                CURRENT_BRIDGE_STATE_ID
            );

            const snap = await getDoc(docRef);

            if (!snap.exists()) return null;

            const data = snap.data() as
                | (Omit<CurrentBridgeState, "updatedAt"> & {
                      updatedAt?: { toDate?: () => Date };
                  })
                | undefined;

            if (!data) return null;

            return {
                ...data,
                estimatedWaitTime: normalizeEstimatedWaitTime(
                    data.estimatedWaitTime
                ),
                updatedAt: data.updatedAt?.toDate
                    ? data.updatedAt.toDate()
                    : new Date(),
            } as CurrentBridgeState;
        } catch (error) {
            logError("FirebaseRepo", "Failed to fetch bridge state", error);
            throw error;
        }
    },

    subscribeToBridgeState(callback, onError) {
        const docRef = doc(
            db,
            BRIDGE_STATE_COLLECTION,
            CURRENT_BRIDGE_STATE_ID
        );

        return onSnapshot(
            docRef,
            (snap) => {
                if (!snap.exists()) {
                    callback(null);
                    return;
                }

                const data = snap.data() as Omit<
                    CurrentBridgeState,
                    "updatedAt"
                > & {
                    updatedAt?: { toDate?: () => Date };
                };

                callback({
                    ...data,
                    estimatedWaitTime: normalizeEstimatedWaitTime(
                        data.estimatedWaitTime
                    ),
                    updatedAt: data.updatedAt?.toDate
                        ? data.updatedAt.toDate()
                        : new Date(),
                });
            },
            (error) => {
                onError?.(error);
            }
        );
    },

    async updateCurrentBridgeState(update) {
        try {
            const batch = writeBatch(db);

            const currentRef = doc(
                db,
                BRIDGE_STATE_COLLECTION,
                CURRENT_BRIDGE_STATE_ID
            );

            const eventRef = doc(collection(db, EVENTS_COLLECTION));

            batch.update(currentRef, {
                ...update,
                id: CURRENT_BRIDGE_STATE_ID,
                updatedAt: serverTimestamp(),
            });

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
};
