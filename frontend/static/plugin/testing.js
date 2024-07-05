function TestMessage()
{
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/test_xml", true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    var message="This is a test";
    xhr.send(message);
    alert("xhr sent..." + message);
}