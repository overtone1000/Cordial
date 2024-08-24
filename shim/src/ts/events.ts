//These functions are called by isite to give the plugin information about isite's state changes

import { Send_Event } from "./shim_event_sender";

//When a user selects a menu item added with AddViewMenuItem
//function Radiology_EventViewMenuSelected(menuitem, xmlContext) {
//    //alert("Radiology_EventViewMenuSelected");    
//}

//When a user selects a menu item added with AddExamMenuItem
//function Radiology_EventExamMenuSelected(menuitem, examID) {
//    //alert("Radiology_EventExamMenuSelected");
//}

//When a user selects a menu item added with AddShelfMenuItem
//function Radiology_EventShelfMenuSelected(menuitem, canvasPageID, shelfID) {
//    //alert("Radiology_EventShelfMenuSelected");
//}

function Radiology_EventLogout() {
    Send_Event(
        "logout"
    );
}

//function Radiology_EventPreferencesApplied() {
//    //alert("Radiology_EventPreferencesApplied");
//}

//When user navigates to a folder page, API reports the full path of the visible folder, canvas, or API tab.
function Radiology_EventPageStatus(
    nameOrID:string, //full path name of the page made visible
    type:"FOLDER"|"CANVS"|"API",
    visible:"TRUE"|"FALSE") {
    Send_Event(
        {
            page_status:[nameOrID,type,visible]
        }
    );
}

//When shelf is loaded into memory
//function Radiology_EventShelfLoaded(
//    canvasPageID:string, //id of canvas that owns the shelf
//    shelfID:string) {//shelf id)
//    //alert("Radiology_EventShelfLoaded");
//}

//When a user selects a menu item added with AddShelfButton
//function Radiology_EventShelfButton(buttonID, shelfID) {
//    //alert("Radiology_EventShelfButton");
//}

//When user closes a canvas page
//function Radiology_EventCanvasPageClosed(canvasPageID) {
//    //alert("Radiology_EventCanvasPageClosed");
//}