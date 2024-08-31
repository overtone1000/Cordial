var local_debug = true;
var remote_debug = false;

function Shim_Debug(debug_message: string): void {

    if (local_debug) {
        console.log(debug_message);
    }

    if (remote_debug) {
        var response = Debug_Event(debug_message);

        var test_node = document.getElementById("test_result");
        test_node.innerHTML = "Response from server: " + response;
    }
}