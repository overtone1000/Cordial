
type ShimPost = ShimEvent | ShimCallResponse;

var event_url = "http://localhost:43528/";

function Send_Event_Post(post: ShimPost) {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", event_url, true);
    xhr.timeout = 1000;
    xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
    xhr.send(JSON.stringify(post));
}

function Send_Event(post: ShimPost) {
    //setTimeout(Send_Event_Post,0,[post]); //Argument not passed when using iSite?
    //Send_Event_Post(post); //freezes UI to call directly even if asynchronous    

    var f = function ()
    {
        Send_Event_Post(post);
    }

    setTimeout(f,0);
}