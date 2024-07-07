
function onload (event)
{
    alert("Result loaded.");
    if(event)
    {
        alert(event);
    }
    else
    {
        alert("Empty response?");
    }
}

function waiting ()
{

}

function TestMessage()
{
    var async_request=false;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5173/test_xml", async_request);
    xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type regardless of what's actually contained. 'plain/text' caused CSRF protection to manifest.
    var message="This is a test";
    xhr.send(message);

    //alert("Response: " + xhr.readyState + " " + xhr.status + " " + xhr.statusText + " " + xhr.responseText);
    

    /*
    while(xhr.readyState !=4)
    {
        setTimeout(waiting, 500);
    }
    if(xhr.status >= 200 && xhr.status <= 300) //Success
    {
        onload(xhr.responseText);
    }
    else
    {
        alert("Wrong xhr status:" + xhr.statusText);
    }
    */
}