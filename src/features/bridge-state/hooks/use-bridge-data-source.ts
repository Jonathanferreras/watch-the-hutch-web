import { useEffect, useState } from "react";
import {
    getBridgeDataSource,
    subscribeToDataSource,
} from "../bridge-state.store";

export function useBridgeDataSource() {
    const [source, setSource] = useState(getBridgeDataSource());

    useEffect(() => {
        return subscribeToDataSource(setSource);
    }, []);

    return source;
}