import { tauriInteraction } from "./commons";

export interface DebugInteraction {
    Debug: string;
}

export let tauriDebug = (message: string) => {
    tauriInteraction({
        interaction: {
            Debug: message
        }
    });
};