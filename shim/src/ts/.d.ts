export interface Radiology_Interface {
    GetCurrentUser: () => string,

    GetVersion: () => string,
    
    GetLastErrorCode: () => string,
    
    Query:(
        query: string,
        query_type: "INTERPRETATION" | "LOOKUP" | "EXCEPTION" | "REFERRING", ////Interpretation looks pretty good because it won't return exams older than 90 days.
        max_results:number
    )=>string //Returns the results as XML. Returns empty string if error.
    
    OpenCanvasPage:(
        internal_exam_id:string, //the internal exam ID to open. Must be empty if internal_exception_id is populated
        internal_exception_id:string, //the internal exception ID to open. Must be empty if internal_exam_id is populated.
        reveal:boolean, //true if the exam should be made visible (opens the canvas, not just puts it in the open list)
        lock:boolean, //true oif the exam should be locked (ignored in Enterprise)
        open_new:boolean //true if an existing page should not be used
    ) => string, //returns the canvas page ID or empty if there was an error
    
    CloseCanvasPage:(
        canvas_page_id:string, //canvas page ID to close
        discard_changes:boolean, //?
    )=>boolean, //Success/failure

    ListCanvasPages:()=>string, //XML containing the canvas page IDs

    GetCanvasPageStatus:(
        canvas_page_id:string, //canvas page of interest
    )=>string //XML containing canvas page details
    
    LockExam:(
        internal_exam_id:string, //internal exam ID
        lock_status:boolean //true will lock the exam, false will unlock it
    )=>boolean, //Success/failure

    FindShelfID:(
        internal_exam_id:string //the internal exam ID whose shelf should be found
    )=>string, //XML encoded string with shelf IDs; empty if error
    
    GetShelfStatus:( //exam/canvas page should be open before calling this method
        shelf_id:string //shelf ID whose status is needed
    )=>string, //XML encoded shelf status; empty if error
    
    ListShelfs:(
        canvas_page_id:string //canvas page ID to get shelfs from
    )=>string, //XML encoded string with shelf status including shelf IDs and ID (one ID for the collection of shleves?); empty if error
    
}