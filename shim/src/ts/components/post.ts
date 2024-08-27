type ShimPost = ShimEvent | ShimCallResponse;

function Send_Post(event: ShimPost) {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", event_url, true); //Trying true here, will see if it works...
    xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
    xhr.send(JSON.stringify(event));

    return null;
}