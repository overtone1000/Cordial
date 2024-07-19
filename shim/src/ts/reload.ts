function Reload() {
    var newpathname=window.location.pathname;
    var file_prefix="file://";

    if(window.location.href.length>file_prefix.length && window.location.href.substring(0,file_prefix.length)===file_prefix)
    {
        newpathname=file_prefix+newpathname;
    }
    window.location.href=newpathname;
}