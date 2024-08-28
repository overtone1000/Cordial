
type ShimPost = ShimEvent | ShimCallResponse;

var event_url = "http://localhost:43528/";

function Send_Event(post: ShimPost) {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", event_url, true);
    xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
    xhr.send(JSON.stringify(post));

    return null;
}