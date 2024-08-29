//import { Shim_Debug } from "./shim_event_sender.js"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.

type Radiology_Interface = import ("./.d.ts").Radiology_Interface;
declare var Radiology: Radiology_Interface;

function OnLoad() {
    main_thread_console("Initializing.");

    var user;
    var _iSiteVersion;
    try {
        user = Radiology.GetCurrentUser();
    }
    catch (e) {
        Shim_Debug("Couldn't get user.");
        return;
    }

    try {
        _iSiteVersion = Radiology.GetVersion();
        if (_iSiteVersion < "3.5") {
            Shim_Debug("Version is lower than expected: " + _iSiteVersion);
        }
    }
    catch (e) {
        Shim_Debug("Couldn't get iSite version.");
    }

    if (user !== undefined) {
        Shim_Debug("User is " + user);
        Shim_Debug("Version is " + _iSiteVersion);
    }
    else {
        Shim_Debug("Undefined user.");
    }

    PollForCalls();
    main_thread_console("Initialized.");
}

function OnUnload() {

}