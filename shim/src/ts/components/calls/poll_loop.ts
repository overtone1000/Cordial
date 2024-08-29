//import { Query, RadiologyQuery } from "./query"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.
//import { QueryResultEvent, Send_Event, Shim_Debug } from "./shim_event_sender"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.

//Starts looping polling to application
//Send synchronously to await response (necessary for Mozilla v4) but call from setTime to avoid blocking

var call_url = "http://localhost:43529/";

function on_state_change(this: XMLHttpRequest, ev: Event):void
{
    switch(this.readyState)
    {
        case XMLHttpRequest.DONE:{
            PollForCalls();
        }
    }
}

function on_poll_load(this: XMLHttpRequest, ev: ProgressEvent):void{
    poll_thread_console("Call received");
    PollForCalls();
    handleCall(this.responseText);
}

function retry(this: XMLHttpRequest, ev: ProgressEvent):void{
    poll_thread_console("Retrying poll: " + this.statusText);
    PollForCalls();
}

function handleCall(response_text:string)
{
    var calls = JSON.parse(response_text) as [Call]; //Comes as an array of calls even if it's just one.

    for (var call of calls)
    {
        poll_thread_console("Handling " + call.context);
        switch (call.context)
        {
            case "query":
                {
                    //If call is a query, perform the isite query and send the reponse as an event
                    var query = call.data as Query;
                    var result = RadiologyQuery(query);
                    var response:QueryResultEvent={
                        query:query,
                        result:result
                    };
                    poll_thread_console("Responding to query with: " + JSON.stringify(response));
                    Send_Event(response);
                }
        }
    }
}

function PollForCalls() {
    poll_thread_console("Polling.");
    var xhr = new XMLHttpRequest();

    try
    {
        xhr.open("GET", call_url, true);
        xhr.timeout=5000;
        xhr.onreadystatechange = on_state_change; //Handles repeating the poll
        xhr.onload = on_poll_load; //successful load
        xhr.onabort = retry;
        xhr.ontimeout = retry;
        xhr.onerror = retry;

        xhr.send();
    }
    catch(e)
    {
        poll_thread_console("Retrying poll after error: " + xhr.statusText);
        PollForCalls();
    }
}