function Shim_Debug(debug_message:string): void {

    var debug_event: DebugEvent = {
        debug:debug_message
    };

    var response = Send_Event(debug_event);

    var test_node = document.getElementById("test_result");
    test_node.innerHTML = "Response from server: " + response;
}