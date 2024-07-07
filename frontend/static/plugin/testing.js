
function on_xhr_load (event)
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



function RunTest()
{
    alert("Running test.");
    var async_request=true;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5173/test_xml", async_request);
    xhr.setRequestHeader('Content-Type', 'application/text'); //Leave this content type regardless of what's actually contained. 'plain/text' caused CSRF protection to manifest.
    //xhr.onload=()=>{alert("Hi!")};
    //xhr.addEventListener("load",on_xhr_load); //Doesn't work
    var message="{message:test}";    
    xhr.send(message);
}

