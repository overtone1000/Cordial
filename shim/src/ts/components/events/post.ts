
type ShimPost = ShimEvent | ShimCallResponse;

var event_url = "http://localhost:43528/";
var TIMEOUT=1000;

function getEventAbortFunction(xhr:XMLHttpRequest)
{
    return function ()
    {
        try
        {
            if (xhr.readyState !== XMLHttpRequest_DONE)
            {
                xhr.abort();
            }
        }
        catch(e)
        {
            console.info(e);
        }
    };
}

function Send_Event_Post(post: ShimPost) {
    try
    {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", event_url, true);
        xhr.timeout = TIMEOUT;
        xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
        xhr.send(JSON.stringify(post));

        setTimeout(getEventAbortFunction(xhr),TIMEOUT*2); //Trying this to address black screen
    }
    catch(e)
    {
        console.info(e);
    }
}

function Send_Event(post: ShimPost) {
    //setTimeout(Send_Event_Post,0,[post]); //Argument not passed when using iSite?
    //Send_Event_Post(post); //freezes UI to call directly even if asynchronous    

    try
    {
        var f = function ()
        {
            Send_Event_Post(post);
        }

        setTimeout(f,0);
    }
    catch(e)
    {
        console.info(e);
    }
}