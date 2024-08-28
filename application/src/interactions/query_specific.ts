import { tauriInteraction } from "./commons";

export interface SpecificQueryInteraction {
    SpecificQuery:[
        string, //mrn
        string //accession
    ]
}

export let specificQuery = (mrn:string, accession:string) => {
    tauriInteraction({
        interaction:{
            SpecificQuery: [
                mrn,
                accession
            ]
        }
    });
};
