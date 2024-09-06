//import { Query, RadiologyQuery } from "./query"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.
//import { QueryResultEvent, Send_Event, Shim_Debug } from "./shim_event_sender"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.

//Starts looping polling to application
//Send synchronously to await response (necessary for Mozilla v4) but call from setTime to avoid blocking

var call_url = "http://localhost:43529/";
var XMLHttpRequest_DONE = 4; //Whoops, XMLHttpRequest properties don't exist in Mozilla 4 (they're undefined)! Need to use coded values!
var XMLHttpRequest_SUCCESS = 200;

var ERR_DELAY = 500;
var WATCHDOG_DELAY = 5000; //Should be low enough to quickly pick up communication if the server restarts but long enough to cause minimal resource utilization.
var POLL_TIMEOUT = 10000; //Should be longer than watchdog delay to avoid gaps

var last_poll:number = 0;

//Handle repeat polling here...
function on_state_change(this: XMLHttpRequest, ev: Event): void {
    //Shim_Debug("XMLHttpRequest State Change. Ready state is " + this.readyState);
    if (this.readyState === XMLHttpRequest_DONE) {
        try
        {
            if (this.status===XMLHttpRequest_SUCCESS)
            {
                handleCall(this.responseText);
            }
        }
        finally
        {
            private_PollForCalls() //Repeat polling without delay.
        }
    }
}

//Not proven reliable yet, just send debug.
function on_load(this: XMLHttpRequest, ev: ProgressEvent): void {
    Shim_Debug("XMLHttpRequest Onload");
}

//Not proven reliable yet, just send debug.
function on_timeout(this: XMLHttpRequest, ev: ProgressEvent): void {
    Shim_Debug("XMLHttpRequest Timeout");
}

//Not proven reliable yet, just send debug.
function on_error(this: XMLHttpRequest, ev: ProgressEvent): void {
    Shim_Debug("XMLHttpRequest Error");
}

//Not proven reliable yet, just send debug.
function on_abort(this: XMLHttpRequest, ev: ProgressEvent): void {
    Shim_Debug("XMLHttpRequest Abort");
}

function handleCall(response_text: string) {
    try {
        Shim_Debug("Handling " + response_text);

        var calls = JSON.parse(response_text) as [Call]; //Comes as an array of calls even if it's just one.

        for (var call of calls) {
            switch(call)
            {
                case "handshake":{}
                default:
                {
                    //If we are here, call is an ObjectCall, so inspect keys
                    for(var call_key in call as ObjectCall)
                    {
                        Shim_Debug("Handling key: " + call_key);
                        switch (call_key) {
                            case "query":
                                {
                                    var query = call[call_key] as Query;
                                    //If call is a query, perform the isite query and send the reponse as an event
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
            }
        }
    }
    catch (e) {
        Shim_Debug("Couldn't handle call " + response_text);
    }
}

function private_PollForCalls() {

    if (enabled) {
        try
        {
            Shim_Debug("Polling");
            last_poll = Date.now();
            var xhr = new XMLHttpRequest();
            xhr.open("GET", call_url + "?" + Date.now(), true); //Must be async. Freezes UI otherwise.
            xhr.timeout = POLL_TIMEOUT;
            xhr.onreadystatechange = on_state_change; //This is called on test browser and isite
            xhr.onload = on_load; //This is called on test browser but NOT in isite
            xhr.ontimeout = on_timeout; //This is called in isite but not sure it works correctly
            xhr.onerror = on_error; //Not observed in isite
            xhr.onabort = on_abort; //Not observed in isite
            xhr.send();
        }
        catch(e)
        {

        }
    }
}

function StartCallPolling() {
    if(enabled)
    {
        var timenow = Date.now();
        if(last_poll+WATCHDOG_DELAY<timenow)
        {
            Shim_Debug("Watchdog restarted polling.");
            setTimeout(private_PollForCalls, WATCHDOG_DELAY);
        }
        else
        {
            Shim_Debug("Watchdog standing down.");
        }
        setTimeout(StartCallPolling, WATCHDOG_DELAY); //Just loops this every WATCHDOG_DELAY milliseconds.
    }
}