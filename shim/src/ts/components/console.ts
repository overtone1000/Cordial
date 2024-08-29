//var console_contents:string[] = [];
var max_length=10;

/*
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
*/

class UI_Console
{
    div_name:string;
    contents:string[];
};

function createConsolePublisher(div_name:string)
{
    var console:UI_Console = {
        div_name:div_name,
        contents:[]
    };

    return function publishToConsole(message:string)
    {
        if(console.contents.length>max_length-1)
        {
            console.contents=console.contents.slice(-max_length,undefined);
        }
        console.contents.push(Date.now().toString() + ": " + message);
    
        var to_string = "";
        for(var entry of console.contents)
        {
            to_string += entry + "<br>";
        }
    
        document.getElementById(console.div_name).innerHTML = to_string;
    };
}

var main_thread_console = createConsolePublisher("main_thread_console");
var poll_thread_console = createConsolePublisher("poll_thread_console");
var event_thread_console = createConsolePublisher("event_thread_console");