function Debug_Event(debug_message: string): void {
    var debug_event: DebugEvent = {
        debug: debug_message
    };
    Send_Event(debug_event);
}