//import { Query } from "./query"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.

var event_url = "http://localhost:43528/";

type Context = "debug" | "logout" | "page_status" | "query_result";

interface DebugEvent {
    debug:{
        message:string,
        object?:{}
    }
}

type LogoutEvent = "logout";

interface PageStatusEvent {
    page_status: [string,"FOLDER"|"CANVS"|"API","TRUE"|"FALSE"]
}

interface QueryResultEvent {
    query: Query
    result: string
}

type ShimEvent = DebugEvent | LogoutEvent | PageStatusEvent | QueryResultEvent;

//Sends events from iSite
//Send asynchronously so iSite isn't blocked.
function Send_Event(event: ShimEvent) {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", event_url, true); //Trying true here, will see if it works...
    xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
    xhr.send(JSON.stringify(event));

    return null;
}

function Shim_Debug(debug_message:string, debug_object?:{}): void {
    var debug_data = {
        message: debug_message,
        object: debug_object
    };

    var debug_event: DebugEvent = {
        debug:debug_data
    };

    var response = Send_Event(debug_event);

    var test_node = document.getElementById("test_result");
    test_node.innerHTML = "Response from server: " + response;
}