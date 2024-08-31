//import { Query, RadiologyQuery } from "./query"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.
//import { QueryResultEvent, Send_Event, Shim_Debug } from "./shim_event_sender"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.

//Starts looping polling to application
//Send synchronously to await response (necessary for Mozilla v4) but call from setTime to avoid blocking

var call_url = "http://localhost:43529/";
var XMLHttpRequest_DONE = 4; //Whoops, XMLHttpRequest properties don't exist in Mozilla 4 (they're undefined)! Need to use coded values!
var XMLHttpRequest_SUCCESS = 200;

var ERR_DELAY = 500;
var POLL_TIMEOUT = 5000; //Should be low enough to quickly pick up communication if the server restarts but long enough to cause minimal resource utilization.

function on_state_change(this: XMLHttpRequest, ev: Event): void {
    if (this.readyState === XMLHttpRequest_DONE) {
        if (this.status === XMLHttpRequest_SUCCESS) {
            var delay = undefined; //If there is no error, introduce no delay to next poll.
            try {
                if (this.responseText !== undefined && this.responseText !== null) {
                    handleCall(this.responseText);
                }
                else {
                    Shim_Debug("Response is empty.");
                }
            }
            catch (e) {
                Shim_Debug("State change function error.");
                delay = ERR_DELAY; //If there was an error, introduce a short delay.
            }
            StartCallPolling(delay);
        }
        else {
            Shim_Debug("Poll exited with status " + this.status);
            StartCallPolling(ERR_DELAY); //Introduce a delay after a failure.
        }
    }
}

//Never called.
/*
function on_load(this: XMLHttpRequest, ev: ProgressEvent):void
{
    Shim_Debug("!!!Load");
    
    
}
*/

function handleCall(response_text: string) {
    try {
        var calls = JSON.parse(response_text) as [Call]; //Comes as an array of calls even if it's just one.

        for (var call of calls) {
            switch (call.context) {
                case "query":
                    {
                        //If call is a query, perform the isite query and send the reponse as an event
                        var query = call.data as Query;
                        var result = RadiologyQuery(query);
                        var response: QueryResultEvent = {
                            query: query,
                            result: result
                        };
                        Send_Event(response);
                    }
            }
        }
    }
    catch (e) {
        Shim_Debug("Couldn't handle call " + response_text);
    }
}

function private_PollForCalls() {

    if (enabled) {
        Shim_Debug("Polling");
        var xhr = new XMLHttpRequest();
        xhr.open("GET", call_url, true); //Must be async. Freezes UI otherwise.
        xhr.timeout = 5000;
        xhr.onreadystatechange = on_state_change;
        xhr.send();
    }
}

function StartCallPolling(delay?: number) {
    //Seems like this needs to be done with setTimeout otherwise UI freezes
    setTimeout(private_PollForCalls, delay);
}