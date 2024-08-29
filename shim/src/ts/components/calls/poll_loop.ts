//import { Query, RadiologyQuery } from "./query"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.
//import { QueryResultEvent, Send_Event, Shim_Debug } from "./shim_event_sender"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.

//Starts looping polling to application
//Send synchronously to await response (necessary for Mozilla v4) but call from setTime to avoid blocking

var call_url = "http://localhost:43529/";

function StartCallPolling() {
    setTimeout(Call_Poll);
}

function Waiting() {
    Shim_Debug("Waiting for response...");
}

function Call_Poll() {
    Shim_Debug("Should add try - catch, or is that supported in this environment?");

    try
    {
        var xhr = new XMLHttpRequest();

        xhr.open("GET", call_url, false);
        xhr.send();

        while(xhr.readyState !== XMLHttpRequest.DONE)
        {
            setTimeout(Waiting,1000);
        }
        
        var response_text = xhr.responseText;
        Shim_Debug("Received response: " + response_text);
        var calls = JSON.parse(response_text) as [Call]; //Comes as an array of calls even if it's just one.

        Shim_Debug("Using syntax here for (var call of calls) but will it work?");
        for (var call of calls)
        {
            Shim_Debug("Iterating calls");
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
                        Shim_Debug("Responding to query with: " + JSON.stringify(response));
                        Send_Event(response);
                    }
            }
        }

        Shim_Debug("Poll loop still happening too quickly. Disabled for now.");
        //setTimeout(Call_Poll);
    }
    catch
    {
        //If polling fails, wait a bit before trying again
        setTimeout(Call_Poll,5000);
    }
}