function RunTest()
{
    var async_request=false;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5173/test_xml", async_request);
    xhr.setRequestHeader('Content-Type', 'application/json'); //Leave this content type as application. 'plain/text' caused CSRF protection to manifest.
    //xhr.addEventListener("load",on_xhr_load); //Doesn't work
    var message=JSON.stringify(xhr);
    xhr.send(message);

    var test_node=document.getElementById("test_result");
    test_node.innerHTML=xhr.responseText;
}

