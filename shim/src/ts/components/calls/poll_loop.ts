//import { Query, RadiologyQuery } from "./query"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.
//import { QueryResultEvent, Send_Event, Shim_Debug } from "./shim_event_sender"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.

//Starts looping polling to application
//Send synchronously to await response (necessary for Mozilla v4) but call from setTime to avoid blocking

var call_url = "http://localhost:43529/";
var min_timeout = 4; //Determined by html standard that nested setTimeouts will need to be 4 ms after 5 levels of nesting

function StartCallPolling() {
    setTimeout(Call_Poll,min_timeout);
}

function Call_Poll() {
    info("Polling.");

    try
    {
        var xhr = new XMLHttpRequest();

        xhr.open("GET", call_url, false);
        xhr.timeout=5000;
        //xhr.onreadystatechange = function () {Shim_Debug("On ready state change " + this.readyState);}
        xhr.send();

        var response_text = xhr.responseText;
        info("Poll received response: " + response_text);
        var calls = JSON.parse(response_text) as [Call]; //Comes as an array of calls even if it's just one.

        Shim_Debug("Using syntax here for (var call of calls) but will it work?");
        for (var call of calls)
        {
            info("Iterating calls");
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
                        info("Responding to query with: " + JSON.stringify(response));
                        Send_Event(response);
                    }
            }
        }

        info("Finished polling.");
        //Shim_Debug("Poll loop still happening too quickly. Disabled for now.");
        //setTimeout(Call_Poll,min_timeout);
    }
    catch(e)
    {
        info("Polling error. " + e.toString());
        //If polling fails, wait a bit before trying again
        //Shim_Debug("Poll loop still happening too quickly. Disabled for now.");
        //setTimeout(Call_Poll,5000);
    }
}