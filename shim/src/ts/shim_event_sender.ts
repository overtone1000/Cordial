var event_url = "http://localhost:43528/";
var context_debug = "debug";
var context_event_logout = "logout";
var context_event_pagestatus = "pagestatus";

function Send_Event(api_context: string, body: string) {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", event_url, false);
    xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
    xhr.send(body);

    return null;
}

function Shim_Debug(debug_message:string, debug_object?:{}): void {
    var message_obj = {
        debug_message: debug_message,
        debug_object: debug_object
    };

    var body = JSON.stringify(message_obj);

    var response = Send_Event(context_debug, body);

    var test_node = document.getElementById("test_result");
    test_node.innerHTML = "Response from server: " + response;
}