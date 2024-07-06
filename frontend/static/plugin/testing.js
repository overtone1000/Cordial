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
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5173/test_xml", true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    var message="This is a test";
    xhr.send(message);
    

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

}