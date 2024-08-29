var console_contents:string[] = [];
var max_length=30;

function info(message:string)
{
    if(console_contents.length>max_length-1)
    {
        console_contents=console_contents.slice(-max_length,undefined);
    }
    console_contents.push(Date.now().toString() + ": " + message);

    var to_string = "";
    for(var entry of console_contents)
    {
        to_string += entry + "<br>";
    }

    document.getElementById("console_contents").innerHTML = to_string;
}