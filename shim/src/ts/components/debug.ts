function Shim_Debug(debug_message: string): void {

    if (Radiology === undefined) {
        if(typeof console !== undefined && console !== undefined)
        {
            console.log(debug_message);
        }
    }
    else {
        Debug_Event(debug_message);
    }
}