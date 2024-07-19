var url = "http://localhost:5173/shim_api/";
var debug_context = "debug_message";

function Shim_POST(api_context:string, body:string, return_response:boolean) {
    var async_request = false;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url + api_context, async_request);
    xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
    //xhr.addEventListener("load",on_xhr_load); //Doesn't work
    //var message=JSON.stringify(xhr);
    xhr.send(body);

    if (return_response) {
        return xhr.responseText;
    }
    else {
        return null;
    }
}

function Shim_Debug(debug_message, debug_object?): void {
    var message_obj = {
        debug_message: debug_message,
        debug_object: debug_object
    };

    var body = JSON.stringify(message_obj);

    var response = Shim_POST(debug_context, body, true);

    var test_node = document.getElementById("test_result");
    test_node.innerHTML = "Response from server: " + response;
}