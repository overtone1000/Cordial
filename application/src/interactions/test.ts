import { tauriInteraction } from "./commons";

export interface TestInteraction {
    Test: number;
}

export let runTest = (test_index:number) => {
    tauriInteraction ({interaction:{
        Test:test_index
    }});
};