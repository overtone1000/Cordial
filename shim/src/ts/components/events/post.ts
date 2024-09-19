
type ShimPost = ShimEvent | ShimCallResponse;

var event_url = "http://localhost:43528/";
var TIMEOUT = 1000;

var xhr_event = new XMLHttpRequest(); //Use one instance to avoid memory leak

function eventAbortFunction() {
    try {
        if (xhr_event.readyState !== XMLHttpRequest_DONE) {
            xhr_event.abort();
        }
    }
    catch (e) {
        console.info(e);
    }
}

function Send_Event_Post(post: ShimPost) {
    try {
        xhr_event.open("POST", event_url, true);
        xhr_event.timeout = TIMEOUT;
        xhr_event.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
        xhr_event.send(JSON.stringify(post));

        setTimeout(eventAbortFunction, TIMEOUT * 2); //Trying this to address black screen
    }
    catch (e) {
        console.info(e);
    }
}

function Send_Event(post: ShimPost) {
    //setTimeout(Send_Event_Post,0,[post]); //Argument not passed when using iSite?
    //Send_Event_Post(post); //freezes UI to call directly even if asynchronous
    if (enabled) {
        try {
            var f = function () {
                Send_Event_Post(post);
            }

            setTimeout(f, 0);
        }
        catch (e) {
            console.info(e);
        }
    }
}