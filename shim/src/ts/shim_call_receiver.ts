var call_url = "http://localhost:43529/";
var context_debug = "debug";

function StartHeartbeat() {
    setTimeout(Call_Poll);
}

function Call_Poll() {
    Shim_Debug("Should add try - catch, or is that supported in this environment?");

    var xhr = new XMLHttpRequest();

    xhr.open("GET", call_url, false);
    xhr.send();

    var response = JSON.parse(xhr.responseText);

    Shim_Debug("Need to handle calls in shim API.");

    //Send a new request.
    setTimeout(Call_Poll);
}