export interface Radiology_Interface {
    GetCurrentUser: () => string,
    GetVersion: () => string,
    GetLastErrorCode: () => string,
    Query(query: string, query_type: "INTERPRETATION" | "LOOKUP", 1)
}