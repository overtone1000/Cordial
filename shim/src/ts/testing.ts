function RunTest() {
    var result = QueryMRN(2070192);
    Shim_Debug(JSON.stringify(result));

    Shim_Debug("href=" + window.location.href);
    Shim_Debug("pathname=" + window.location.pathname);
    Shim_Debug("search=" + window.location.search);
    Shim_Debug("hash=" + window.location.hash);

    //StartHeartbeat();
}


//Proof of concept for asynchrony on Firefox 4
function StartHeartbeat() {
    setTimeout(Heartbeat, 1500);
}

var beatcount = 0;
function Heartbeat() {
    Shim_Debug("Heartbeat " + beatcount++);
    StartHeartbeat();
}