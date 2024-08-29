
type ShimPost = ShimEvent | ShimCallResponse;

var event_url = "http://localhost:43528/";

function Send_Event(post: ShimPost) {
    event_thread_console("Posting event.");
    var xhr = new XMLHttpRequest();

    xhr.open("POST", event_url, true);
    xhr.timeout = 1000;
    xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
    
    //Disabled for now
    //xhr.send(JSON.stringify(post));

    event_thread_console("Finished posting.");
    return null;
}