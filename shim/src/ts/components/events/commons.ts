//import { Query } from "./query"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.

type Context = "debug" | "logout" | "page_status" | "query_result";

interface DebugEvent {
    debug:string //keys get switch to lower case
}

type LogoutEvent = "logout";

interface PageStatusEvent {
    pagestatus: [string,"FOLDER"|"CANVAS"|"API","0"|"1"] //keys get switch to lower case
}

interface QueryResultEvent {
    query: Query
    result: string
}

type ShimEvent = DebugEvent | LogoutEvent | PageStatusEvent | QueryResultEvent;

//Sends events from iSite
//Send asynchronously so iSite isn't blocked.

