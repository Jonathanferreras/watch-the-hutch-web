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
import { CURRENT_BRIDGE_STATE_ID } from "../bridge-state.types";
import { BridgeStateRepository } from "../bridge-state.repository";
import { logError } from "@/src/lib/errors";

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

            const data = snap.data() as any;

            return {
                ...data,
                updatedAt: data.updatedAt?.toDate
                    ? data.updatedAt.toDate()
                    : new Date(),
            };
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

                const data = snap.data() as any;

                callback({
                    ...data,
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