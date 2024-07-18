export interface Radiology_Interface {
    GetCurrentUser: () => string,
    GetVersion: () => string,
    GetLastErrorCode: () => string,
    Query:(query: string, query_type: "INTERPRETATION" | "LOOKUP" | "EXCEPTION" | "REFERRING", max_results:number)=>string //Interpretation looks pretty good because it won't return exams older than 90 days. Returns the results as XML. Returns empty string if error.
    OpenCanvasPage:(
        internal_exam_id:string, //the internal exam ID to open. Must be empty if internal_exception_id is populated
        internal_exception_id:string, //the internal exception ID to open. Must be empty if internal_exam_id is populated.
        reveal:boolean, //true if the exam should be made visible (opens the canvas, not just puts it in the open list)
        lock:boolean, //true oif the exam should be locked (ignored in Enterprise)
        open_new:boolean //true if an existing page should not be used
    ) => string, //returns the canvas page ID or empty if there was an error
}