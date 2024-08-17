import { invoke } from '@tauri-apps/api/core';
import type { DebugInteraction } from './debug';

type Interaction = DebugInteraction;

interface InteractionArgument extends Record<string,unknown> { //Has to match InvokeArgs
    interaction: Interaction;
}

export let tauriInteraction = (arg: InteractionArgument) => {
    console.debug('Sending tauri interaction', arg);
    invoke('tauri_ui_interaction', arg)
        .then((res: any) => {
            console.log('tauri_ui_interaction: ', res);
        })
        .catch((e: any) => console.error('tauri_ui_interaction', e));
};

