import { Query, RadiologyQuery } from "./query";
import { QueryResultEvent, Send_Event, Shim_Debug } from "./shim_event_sender";

var call_url = "http://localhost:43529/";
interface QueryCall
{
    context: "query",
    data:Query
}

type Call = QueryCall;

//Starts looping polling to application
//Send synchronously to await response (necessary for Mozilla v4) but call from setTime to avoid blocking
function StartCallPolling() {
    setTimeout(Call_Poll);
}

function Call_Poll() {
    Shim_Debug("Should add try - catch, or is that supported in this environment?");

    var xhr = new XMLHttpRequest();

    xhr.open("GET", call_url, false);
    xhr.send();

    var calls = JSON.parse(xhr.responseText) as [Call]; //Comes as an array of calls even if it's just one.

    Shim_Debug("Using syntax here for (var call of calls) but will it work?");
    for (var call of calls)
    {
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
                    Send_Event(response);
                }
        }
    }

    //Send a new request.
    setTimeout(Call_Poll);
}