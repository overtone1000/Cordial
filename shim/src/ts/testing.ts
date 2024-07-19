function RunTest() {
    var result = QueryMRN(2070192);
    Shim_Debug(JSON.stringify(result));
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