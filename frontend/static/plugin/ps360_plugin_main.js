// ---------------
// Globals
// ---------------
var _currentAccessions = "";	// accession numbers open in current PS360 report
var _reportClosingAccessions = null;    // report accession number during closing
var _activeCanvasPageID = 0;	// last canvas page made visible
var _pendingCloseReport = false;// interrupted work flow: set to true when the plugin closes a report in order to open another.
var _pendingCloseCanvas = false; //set to true inside of OnCloseReport to prevent opening a new canvas while in the process of closing another
var _pendingOpenCanvas = "";	// set to accession number of image being opened by plugin, so that we don't attempt to open the report when the canvas opens.
var _pendingOpenStudyAccession = ""; // Set when openStudy is called while iSite is in the middle of closing a canvas
var _pendingOpenStudyMRN = "";  // Set when openStudy is called while iSite is in the middle of closing a canvas
var _reportClosing = false;		// set to true when we receive a ReportClosed event, "pending" status. Until we receive the next status, we can't accept an OpenStudy request. 
var _launching = false; 		// set to true when asynchronous launch is in progress
var _examPendingLaunch = null;  // will contain the exam to be opened in PS360 if a canvas was opened in 
var _canvasClosed = false;  // check if the canvas closed 
var _isPatientLookUpClick = false  // flag if Patient LookUp is clicked
var _pendingOpenCanvasForPR = ""; // set to accession number of image that is open for peer review so the image can be closed when peer review is done
//TTP 2405/SR 102065054
var _currentPatientMRN = "";
// iSite exam statuses
var _examStatusNames = {
		"O" : "Ordered",
		"S" : "Scheduled",
		"T" : "Taken",
		"I" : "In Progress",
		"C" : "Completed", 
		"D" : "Dictated",
		"P" : "Preliminary",
		"F" : "Finalized",
		"A" : "Addended",
		"R" : "Revised"
	};
// PowerScribe 360 report status names
var _reportStatusNames =
	{
		"-1": "Discarded",
		"0": "Pending",
		"1": "WetRead",
		"2": "Draft",
		"3": "PendingCorrection",
		"4": "Corrected",
		"5": "CorrectionRejected",
		"6": "PendingSignature",
		"7": "SignRejected",
		"8": "Final"
	};

// Logging function
function Log(level, message) {
	if (_logEnabled) {
		LogWriter.Log(level, message);
	}
}
				
// Default error handler for uncaught exceptions
function errorHandler(message, url, line) {
	alert("Script error occurred on line: " + line + " of " + document.location.toString() + ". Error: " + message);
	try {
		Log(1, "->->-> ERROR HANDLER <-<-<- Line: " + line + ", Error: " + message);
	}
	catch (err) {}
	return true; //return true so IE doesn't show generic script exception window.
}

//register handler
window.onerror = errorHandler;

function isdefined(variable) {
	return (window[variable]) == undefined;
}

function contains(a, obj) {
  var i = a.length;
  while (i--) {
    if (a[i] === obj) {
      return true;
    }
  }
  return false;
}

function IsRadWhereCtrlExist() {
    var result;
    if (undefined != RadWhereCtrl && undefined != RadWhereCtrl.LoggedIn)
        result = true;
    else
        result = false;
    Log(5, "IsRadWhereCtrlExist(): " + result);
        
    return result; 
}

//--------------------------------
// Powerscribe360Plugin.htm events
//--------------------------------
function OnLoad() {
	// uncomment to debug:
	//debugger;
	
    if (!IsRadWhereCtrlExist())
	{
		alert("No radwherectrl");
		return;
	}

	// Make sure we are running under a supported version of iSiteRadiology
	var user;   
    try {
        user = iSiteNonVisual.GetCurrentUser();
		alert(JSON.stringify(user));
        alert('The PowerScribe 360 plug-in is only supported for use with iSiteRadiology.');
        return;
    }
    catch (e) {
        try {
            user = Radiology.GetCurrentUser();
        }
        catch (e) {
            alert('This version of Philips iSite can not be used with the PowerScribe 360 plug-in. It is only supported for use with iSiteRadiology.');
            return;
        }
    }
    try {
    	_iSiteVersion = Radiology.GetVersion();
    	if (_iSiteVersion < "3.5") {
    		alert("This version of Philips iSiteRadiology is not supported by the PowerScribe 360 plug-in.");
    		return;
    	}
    }
    catch (e) {
    	alert("This version of Philips iSiteRadiology is not supported by the PowerScribe 360 plug-in.");
    	return;
    }

    // Get RadWhere User preferences from iSite
    GetRadWherePreferences();

    // initialize log writer
    if (_logEnabled == true) {
        try {
            LogWriter.Initialize("PowerScribe 360Plugin", _logDirectory, _logLevel);
        	Log(1, "-------- PowerScribe 360 plug-in " + RW_PLUGIN_VERSION + " " + document.lastModified + ", iSiteRadiology version " + _iSiteVersion + " ---------");
        } catch (e) {
	        alert("An error occurred attempting to create PowerScribe 360's integration log file. Check the PowerScribe 360 plugin log file directory setting in your iSite user preferences.");
		    _logEnabled = false;
        }
    }

    var iSiteUser = Radiology.GetCurrentUser();
    Log(5, "-->OnLoad");
    Log(1, "iSite user: " + iSiteUser);
	// Log user preferences
    Log(1, "User preferences: ");
    var mode;
    switch (_integrationMode) {
    	case PREF_SLAVE: mode = "Use iSite work list";
    		break;
    	case PREF_MASTER: mode = "Use PowerScribe work list";
    		break;
    	case PREF_DUAL: mode = "dual";
    		break;
    }
    Log(1, "Integration mode: " + mode);
	Log(1, "Single sign-on: " + _singleSignOn);
	Log(1, "Mark exam read: " + _markRead);
    Log(1, "Logging level: " + _logLevel);
    Log(1, "Auto-load studies in PS360: " + _autoLoad);
    Log(1, "Automatically close iSite images: " + _closeStudy);
    Log(1, "Automatically close PS360 reports: " + _closeStudy360);
    Log(1, "Logging level: " + _logLevel);
    Log(1, "PS360 Launch on first study: " + _launchOnFirstStudy);
    Log(1, "Automatically link accessions: " + _autoLink);
    Log(1, "Automatically save presentation state: " + _autoSavePresentationState);

    // Create RadWhere User Preferences web page
    AddPrefPage();

    // Launch RadWhere from a new thread after a slight delay.
    // We don't want to execute in the iSite event loop.
    if (!_launchOnFirstStudy || _integrationMode == PREF_MASTER) {
        setTimeout("ConnectToRadWhere()", 50);
    }

    if (_integrationMode != PREF_MASTER) {
		Radiology.AddExamMenuItem(MENU_DICTATE_ONE);
    }

    Log(5, "<--OnLoad");
}

function OnUnload() {
    if (!IsRadWhereCtrlExist())
		return;

	Log(5, "-->OnUnload");
	if (_integrationMode != PREF_MASTER) {
		Radiology.RemoveViewMenuItem(MENU_DICTATE_ONE);
		Radiology.RemoveExamMenuItem(MENU_DICTATE_ONE);
		Radiology.RemoveShelfMenuItem(MENU_DICTATE_ONE);
	}
    if (_connected) {
    	try {
    		if (_integrationMode != PREF_SLAVE) {
    			RadWhereCtrl.StopListening();
    			Log(3, "Stopped listening...");
    		}
			if (_singleSignOn == true) {
	    		RadWhereCtrl.Minimized = false; // Hack to prevent logout prompts to go behind PowerScribe 360 main form
    			RadWhereCtrl.Logout();
    			Log(3, "Logged out...");
    			RadWhereCtrl.Terminate();
    			Log(3, "Terminated.");
    		}
    	} catch (e) {
    		Log(1, "An exception occurred attempting logoff/termination. Error: " + e.Message);
    	}
    }
    Log(5, "<--OnUnload");
}

//----------------------------------
// Internal event handling functions
//----------------------------------

function OnViewMenu(menuitem, xmlContext) {
    Log(5, "-->OnViewMenu; menu item: " + menuitem);
    var doc = xmldso.XMLDocument;
    doc.loadXML(xmlContext);
    var nodeList = doc.getElementsByTagName("WindowInfo");
    var shelfID = nodeList.item(0).selectSingleNode("ShelfID").text;
    var exam = GetExamInfo(null, null, shelfID);
    RadWhereDictate(exam)
    Log(5, "<--OnViewMenu");
}

function OnExamMenu(menuitem, examID) {
	// Dictation is being launched from the patient work list, so we need to lock the exam(s)
	// here, and then unlock them when the report is closed.
	Log(5, "-->OnExamMenu; menuitem: " + menuitem + "; examID: " + examID);
	var exam = GetExamInfo(examID, null);
	if (RadWhereDictate(exam)) {
		Radiology.LockExam(exam.examID, true);
	}
    Log(5, "<--OnExamMenu");
}

function OnShelfMenu(menuItem, canvasPageID, shelfID) {
	Log(5, "-->OnShelfMenu");
	var exam = GetExamInfo(null, null, shelfID);
	RadWhereDictate(exam);
	Log(5, "<--OnShelfMenu");
}

function OnShelfButton(shelfID) {
	Log(5, "-->OnShelfButton");
	var exam = GetExamInfo(null, null, shelfID);
	RadWhereDictate(exam);
	Log(5, "<--OnShelfButton");
}

function OnCanvasOpened() {
	Log(5, "-->OnCanvasOpened; _pendingOpenCanvas for accession: " + _pendingOpenCanvas);
	if (_activeCanvasPageID > 0) {
		if (_integrationMode != PREF_MASTER) {
			// Create menus for dictation in iSite
		    Log(5, "Creating menus...");
			Radiology.AddViewMenuItem(MENU_DICTATE_ONE);
			Radiology.AddShelfMenuItem(MENU_DICTATE_ONE);
			var exam = GetMainExam();
			// Check for ghost mode indicated by the main exam not being locked. NOTE: to allow
			// addendums to be dictated, we have to bypass ghost mode because final exams always
			// show up unlocked.
			var needAutoLoad = false;
			if (_autoLoad == PREF_AUTO_LOAD_ALWAYS)
			    needAutoLoad = (exam.isLocked || exam.status == "F");
			else if (_autoLoad == PREF_AUTO_LOAD_NOT_IN_FINAL)
			    needAutoLoad = (exam.isLocked && (exam.status != "D" && exam.status != "P" && exam.status != "F" && exam.status != "A"));
			if (_autoLoad != PREF_AUTO_LOAD_NEVER && _pendingOpenCanvas != exam.accession && needAutoLoad) {
			    if (!_launching) {
					Log(3, "Auto loading accession in PS360:" + exam.accession);
					RadWhereDictate(exam);
				}
				else {
					Log(3, "Canvas opened in iSite while PS360 still in the process of launching. Saving exam (for accession " + exam.accession + ") to open later.");
					_examPendingLaunch = exam;
				}
			}
			else {
				Log(5, "Skipping autoload of PS360 report.");
			}
		}
	}
	else {
		Log(1, "ERROR: _activeCanvasPageID is not set. Unable to load exam in PS360.");
	}
	_pendingOpenCanvas = "";	// reset since the opening of the canvas is done.
    Log(5, "<--OnCanvasOpened updated");
}

function isOpenInPS360(accession) {
	Log(5, "-->isOpenInPS360; checking accession " + accession);
	var result = false;
	var accessions = null;
	if (isdefined(RadWhereCtrl) && _connected) {
		try {
		    accessions = RadWhereCtrl.AccessionNumbers;
			Log(5, "Accession(s) open in PS360: '" + accessions + "'");
		}
		catch (e) {
			Log(1, "Exception occurred querying PS360 for current accession:\r\n" + e.Message);
		}
		if (accessions != "") {
			var accessionArray = accessions.split(",");
			for (var i = 0; i < accessionArray.length; i++) {
				if (accessionArray[i] == accession) {
					result = true;
					break;
				}
			}
		}
	}
	Log(5, "<--isOpenInPS360");
	return result;
}

//--------------------
// RadWhere functions
//--------------------

function ConnectToRadWhere() {
	Log(5, "-->ConnectToRadWhere");
	//debugger;
	if (_connected == false) {
		if (_singleSignOn == true) {
			if (_user == "") {	// if PS360 user name not specified, we use the iSite user name and null password.
				_user = Radiology.GetCurrentUser();
				Log(3, "PowerScribe 360 user name not specified. Using iSite user name: " + _user);
			}
		}
		else {
			_user = "";
			_password = "";
		}
		_launching = true;
		Log(3, "Launching PS360; user: " + _user);
		RadWhereCtrl.Launch(_user, _password, "");
		}
	else {
		Log(5, "Already connected.");
	}
	Log(5, "<--ConnectToRadWhere");
	return true;
}

function LogoutRadWhereUser() {
	Log(5, "-->LogoutRadWhereUser");
	if (_connected) {
		var rwCurrentUser = RadWhereCtrl.Username;
		if (rwCurrentUser != null) {
			Log(3, "Logging out RadWhere user: " + rwCurrentUser);
			RadWhereCtrl.Logout();
		}
	}
	Log(5, "<--LogoutRadWhereUser");
}

function RadWhereDictate(exam) {
	var opened = false;
	Log(5, "-->RadWhereDictate; accession: " + exam.accession);
	if (_connected || (!_connected && ConnectToRadWhere())) {
	    //DD-225 / DCE-447
	    if (_launching) {
	        _examPendingLaunch = exam;
	        Log(5, "<--RadWhereDictate; _launching: true, _examPendingLaunch: " + exam.accession);
	        return true;
	    }
		RadWhereCtrl.Minimized = false;
		if (isOpenInPS360(exam.accession)) {
			Log(5, "Accession(s) already loaded.");
		}
		else {
			// Make sure user is logged in
			if (RadWhereCtrl.Username != null) {
				// Make sure that there isn't another report opened in PS360. Attempt to close it if so.
				var closeFailed = false;
				if (RadWhereCtrl.AccessionNumbers != "") {
				    Log(3, "PS360 currently has another report open; accession number(s): " + RadWhereCtrl.AccessionNumbers + ". Closing report and setting _pendingCloseReport");
					_pendingCloseReport = true;
					var result;
					try {
						result = RadWhereCtrl.SaveReport(true);
					}
					catch (e) {
						Log(1, "Error: Exception occurred in SaveReport:\r\n" + e.Message);
						result = false;
					}
					if (result = false) {
						Log(2, "Warning: Failed to close report in PS360.");
						closeFailed = true;
						_pendingCloseReport = false;
					}
				}
				if (!closeFailed) {
					var accessions = exam.accession;
					if (_autoLink) {
					    var linkedAccessions = GetLinkedAccessions(exam);
					    if (linkedAccessions != "")
					        accessions = linkedAccessions;
                        else
                            Log(2, "WARNING: no linked accessions found.")
					}
				    //DCE-1571 Phillips iSite Plugin Needs to Send MRN and Accession#
					var accPatientMRN = exam.patientMRN;
					if (accPatientMRN == "") {
					    //Find the patientMRN from examID if exam.patientMRN is empty
					    var examList = null;
					    examList = RadiologyQuery("IDXIntExamID= \"" + exam.examID + "\"");
					    if (null != examList) {
					        var itemPatientMRN = examList.item(0).selectSingleNode("x00100020");
					        if (itemPatientMRN != null)
					            accPatientMRN = itemPatientMRN.text;
					        else
					            accPatientMRN = "";
					        Log(5, "Query IDXIntExamID; accPatientMRN: " + accPatientMRN);
					    }
					    Log(5, "Getting patientMRN from examID: " + exam.examID);
					}

					if (accPatientMRN != null && accPatientMRN != "")
					{
					    Log(5, "Call OpenReportEx accPatientMRN: " + accPatientMRN);
					    opened = RadWhereCtrl.OpenReportEx("", accessions, accPatientMRN);
					}
					else
					{
					    opened = RadWhereCtrl.OpenReport("", accessions);
					}
					if (!opened) {
						Log(2, "Warning: OpenReport failed.");
						_currentAccessions = accessions;
						//TTP 2405/SR 102065054, if failed reset current PatientMRN.
						_currentPatientMRN = "";
					}
                    else {
					    //DCE-1571 Phillips iSite Plugin Needs to Send MRN and Accession#
					    _currentPatientMRN = accPatientMRN;
                        //TTP 2405/SR 102065054
					    //_currentPatientMRN = exam.patientMRN;
                        //if (_currentPatientMRN == "") {
                        //    //Find the patientMRN from examID if exam.patientMRN is empty
                        //    var examList = null;
                        //    examList = RadiologyQuery("IDXIntExamID= \"" + exam.examID + "\"");
                        //    if (null != examList) {
                        //        var itemPatientMRN = examList.item(0).selectSingleNode("x00100020");
                        //        if (itemPatientMRN != null)
                        //            _currentPatientMRN = itemPatientMRN.text;
                        //        else
                        //            _currentPatientMRN = "";
                        //        Log(5, "Query IDXIntExamID; _currentPatientMRN: " + _currentPatientMRN);
                        //    }
                        //    Log(5, "Getting patientMRN from examID: " + exam.examID);
					    //}
				    }
			    }
		    }
	    }
	}
    //TTP 2405/SR 102065054, log _currentPatientMRN
	Log(5, "<--RadWhereDictate; _currentPatientMRN: " + _currentPatientMRN);
	return opened;
}

//--------------------
// iSite functions
//--------------------
function AddPrefPage() {
	Log(5, "-->AddPrefPage");
	// use the prefs file located in this same location
	var thispath = document.location.toString();

	thispath = thispath.toLowerCase();
	var locate = thispath.lastIndexOf("/powerscribe360");
	if (locate > -1) {
		var path = thispath.substring(0, locate);
		var prefpath = path + "/Powerscribe360Prefs.htm";
		Radiology.AddPreferencePage(PREFS_NAME, prefpath, PREFS_TYPE);
	}
	else {
		Log(1, "ERROR: Can't find PowerScribe 360 preference page " + prefpath);
	}
	Log(5, "<--AddPrefPage");
}

function GetShelfStatusAttribute(ShelfStatus, attributeTag) {
	Log(5, "-->GetShelfStatusAttribute: attribute tag:" + attributeTag);
	var attribute = "";
	if (ShelfStatus != "") {
		var doc = xmldso.XMLDocument;
		doc.loadXML(ShelfStatus);
		var nodeList = doc.getElementsByTagName("ShelfStatus");
		attribute = nodeList.item(0).selectSingleNode(attributeTag).text;
	}
	Log(5, "<--GetShelfStatusAttribute");
	return attribute;
}

function GetLinkedAccessions(exam) {
	// Returns a comma delimited list of accession numbers that are linked to the specified exam
	Log(5, "-->GetLinkedAccessions");
	var accessions = "";
	var queryResults = Radiology.FindLinkedExams(exam.examID);
	Log(6, "query results:\r\n" + queryResults);
	if (queryResults != "") {
		var doc = xmldso.XMLDocument;
		doc.loadXML(queryResults);
		nodeList = doc.getElementsByTagName("ExamID");
		for (var i = 0; i < nodeList.length; i++) {
			examID = nodeList.item(i).text
			if (examID != exam.examID) {
				exam = GetExamInfo(examID, null);
			}
			if (i > 0)
				accessions += ",";
			accessions += exam.accession;
		}
	}
	Log(5, "<--GetLinkedAccessions: '" + accessions + "'");
	return accessions;
}

function RadiologyQuery(query) {
	var examNode = null;
	var queryResults = Radiology.Query(query, "INTERPRETATION", 1);
	Log(6, "Query results:\r\n" + queryResults);
	if (queryResults == "") {
		var error = Radiology.GetLastErrorCode();
		Log(1, "ERROR: iSite query failed. Error code:" + error + ". Query:\r\n" + query);
	}
	else {
		var doc = xmldso.XMLDocument;
		doc.loadXML(queryResults);
		var nodeList = doc.getElementsByTagName("QueryResult");
		var numMatches = nodeList.item(0).selectSingleNode("TotalMatches").text;
		if (numMatches == 0) {
			queryResults = Radiology.Query(query, "LOOKUP", 1);
			Log(6, "Query results:\r\n" + queryResults);
			if (queryResults != "") {
				doc = xmldso.XMLDocument;
				doc.loadXML(queryResults);
				nodeList = doc.getElementsByTagName("QueryResult");
				numMatches = nodeList.item(0).selectSingleNode("TotalMatches").text;
			}
		}
		if (numMatches > 0) {
			examNode = doc.getElementsByTagName("Exam");
		}
		else {
			Log(5, "Query returned 0 matches: '" + query + "'");
		}
	}
	return examNode;
}

function GetExamInfo(examID, accession, shelfID, queryPatientMRN) {
	// Given any one of: (a) accession number, (b) exam id, or (c) shelf id
	// returns a class containing the following members:
	//	examID
	//	accession
	//  isRead
	//  status
	//  isLocked
	//  shelfID 
	//	isMainExam
    //  patientMRN, used in OnReportClosed event

	var exam = null;
	var shelfStatus = null;
	var examList = null;
	var doc = xmldso.XMLDocument;
	//TTP 2405/SR 102065054
	var patientMRN = "";

	//TTP 2405/SR 102065054
	Log(5, "-->GetExamInfo; exam ID: " + examID + ", accession: " + accession + ", shelf id: " + shelfID + ", queryPatientMRN: " + queryPatientMRN);
	if (null == shelfID && null == examID) {
		// get the exam id using the accession number
	    //TTP 2405/SR 102065054 get exam id using accession number and queryPatientMRN if available.
	    var queryStr = "";
	    if (queryPatientMRN != undefined && queryPatientMRN != null && queryPatientMRN != "")
	        queryStr = "x00080050 = \"" + accession + "\" AND x00100020 = \"" + queryPatientMRN + "\"";
	    else
	        queryStr = "x00080050 = \"" + accession + "\"";
	    Log(5, "queryStr: " + queryStr);
	    examList = RadiologyQuery(queryStr);
		if (null != examList) {
			Log(6, "examList by accession:\r\n" + examList.item(0).xml);
			examID = examList.item(0).selectSingleNode("IDXIntExamID").text;
			//TTP 2405/SR 102065054
			patientMRN = examList.item(0).selectSingleNode("x00100020").text;
			Log(5, "Query accession; patientMRN: " + patientMRN);
		}
	}
	if (null == shelfID && null != examID) {
	    //TTP 2405/SR 102065054
        Log(5, "null == shelfID && null != examID shelfID:" + shelfID);

		// get the shelf id using the exam id
		var shelfIDs = Radiology.FindShelfID(examID);
		Log(6, "Shelf ids:\r\n" + shelfIDs);
		if (shelfIDs != "") {
		    //TTP 2405/SR 102065054
		    Log(5, "shelfIDs != ");

			doc.loadXML(shelfIDs);
			examList = doc.getElementsByTagName("ID");

			//TTP 2405/SR 102065054
			Log(5, "examList1: " + examList + " shelfID: " + shelfID);

			if (examList != null) {
				Log(6, "examList by shelf/exam:\r\n" + examList.item(0).xml);
				shelfID = examList.item(0).firstChild.nodeValue;

				//TTP 2405/SR 102065054
				Log(5, "examList2: " + examList + " shelfID: " + shelfID);
			}
		}
		else {
		    //TTP 2405/SR 102065054
		    Log(5, "Query IDXIntExamID");

			// The exam isn't open on a shelf, so we just have to query the exam information
			examList = RadiologyQuery("IDXIntExamID= \"" + examID + "\"");
			Log(6, "examList by examID:\r\n" + examList.item(0).xml);
		}
        //TTP 2405/SR 102065054
        Log(5, "shelfID: " + shelfID + " examList: " + examList);

		if (null == shelfID && null != examList) {
			exam = new Object;
			exam.shelfID = "";
			exam.examID = examID;
			exam.accession = examList.item(0).selectSingleNode("x00080050").text;
			exam.isRead = examList.item(0).selectSingleNode("ExamReadFLAG").text == "Y" ? true : false;
			exam.status = examList.item(0).selectSingleNode("IDXExamStatus").text;
			exam.isMainExam = false;
			exam.isLocked = false;

			//dng testing SR 102439410
			if (examList.item(0).selectSingleNode("LockStatus") != null) {
			    var lockStatus = examList.item(0).selectSingleNode("LockStatus").text;
			    Log(5, "Query exam LockStatus: " + lockStatus);
			    exam.isLocked = lockStatus == "Y" ? true : false;
			}
			else if (examList.item(0).selectSingleNode("LockedByName") != null) {
			    //use LockedByName when LockStatus is not available in older version
			    var lockedByName = examList.item(0).selectSingleNode("LockedByName").text;
			    Log(5, "Query exam LockedByName: " + lockedByName);
			    exam.isLocked = lockedByName == "" ? false : true; 
			}			

			//TTP 2405/SR 102065054
            var itemPatientMRN = examList.item(0).selectSingleNode("x00100020");
            if (itemPatientMRN != null)
                patientMRN = itemPatientMRN.text;
            else
                patientMRN = "";
            exam.patientMRN = patientMRN;
			Log(5, "Query examID; patientMRN: " + patientMRN);
		}
	}
	// Now get the shelf status which contains all of the exam information
	if (null == exam && null != shelfID) {
	    //TTP 2405/SR 102065054
	    Log(5, "null == exam && null != shelfID");

		var nodeList = null;
		shelfStatus = Radiology.GetShelfStatus(shelfID);
		Log(6, "Shelf status:\r\n" + shelfStatus);
		if (shelfStatus != "") {
			doc.loadXML(shelfStatus);
			nodeList = doc.getElementsByTagName("ShelfStatus");
			if (nodeList != null) {
				exam = new Object;
				exam.shelfID = shelfID;
				exam.examID = nodeList.item(0).selectSingleNode("IntExamID").text;
				exam.accession = nodeList.item(0).selectSingleNode("x00080050").text;
				exam.isRead = nodeList.item(0).selectSingleNode("ExamReadFLAG").text == "Y" ? true : false;
				exam.status = nodeList.item(0).selectSingleNode("IDXExamStatus").text;
				exam.isMainExam = nodeList.item(0).selectSingleNode("MainExam").text == "1" ? true : false;
				exam.isLocked = nodeList.item(0).selectSingleNode("Locked").text == "1" ? true : false;
				//TTP 2405/SR 102065054
                exam.patientMRN = "";
                Log(5, "Query shelfID; patientMRN: " + exam.patientMRN);
			}
		}
	}
	if (null != exam) {
		Log(5, "exam ID:" + exam.examID + ", accession:" + exam.accession + ", isRead:" + exam.isRead + ", shelf ID:" + exam.shelfID + ", isLocked:" + exam.isLocked + ", status:" + _examStatusNames[exam.status] + ", isMainExam:" + exam.isMainExam);
	}
	Log(5, "<--GetExamInfo");
	return exam;
}

function GetActiveExams() {
	var exams = new Array();
	Log(5, "-->GetActiveExams");
	var mainExam = null;
	if (_activeCanvasPageID > 0) {
		var ShelfList = Radiology.ListShelfs(_activeCanvasPageID);
		Log(6, "Shelf list:\r\n" + ShelfList);
		if (ShelfList != "") {
			var doc = xmldso.XMLDocument;
			doc.loadXML(ShelfList);
			var nodeList = doc.getElementsByTagName("ShelfIDs");
			var idList = nodeList.item(0).getElementsByTagName("ID");
			for (var i = 0; i < idList.length; i++) {
				var shelfID = idList.item(i).text;
				if (shelfID != "") {
					var exam = GetExamInfo(null, null, shelfID);
					exams[i] = exam;
				}
			}
		}
		else {
			var error = Radiology.GetLastErrorCode();
			Log(1, "ERROR getting shelf status. Error code:" + error + ".");
		}
	}
	Log(5, "<--GetActiveExams");
	return exams;
}

function GetMainExam() {
	Log(5, "-->GetMainExam");
	var mainExam = null;
	if (_activeCanvasPageID > 0) {
		var exams = GetActiveExams();
		if (exams.length > 0) {
			for (var i = 0; i < exams.length; i++) {
				if (exams[i] != null && exams[i].isMainExam != null && !(typeof exams[i].isMainExam === "undefined"))
				{
					if (exams[i].isMainExam) {
						mainExam = exams[i];
						break;
					}
				}
				else
				{
					Log(1, "Error in GetMainExam: either the exam does not exist or its propery, isMainExam is not defined");
				}
			}
		}
	}
	var mainID =  (null == mainExam) ? "null" : mainExam.examID;
	Log(5, "<--GetMainExam; id: " + mainID);
	return mainExam;
}

function CloseCanvas(exam) {
	Log(5, "-->CloseCanvas; accession: " + exam.accession);
	// Find the canvas associated with this exam
	var canvasPageID = 0;
	var shelfStatus = Radiology.GetShelfStatus(exam.shelfID);
	if (shelfStatus != "") {
		canvasPageID = GetShelfStatusAttribute(shelfStatus, "CanvasPageID");
	}
	if (0 != canvasPageID) {
		// Close the canvas explicitly
		Log(3, "Radiology.CloseCanvasPage(" + canvasPageID + ", false).");
		_pendingCloseCanvas = true;
		success = Radiology.CloseCanvasPage(canvasPageID, false);
		if (!success) {
			Log(1, "Error in CloseCanvasPage: " + Radiology.GetLastErrorCode());
			// Close Canvas failed, retry once after 50 msec
			setTimeout(function () { CloseCanvasRetry(canvasPageID) }, 50);
		}
	}
	else {
		Log(1, "ERROR: Unable to get canvas page id. Canvas can't be closed.");
	}
    Log(5, "<--CloseCanvas");
}

function CloseCanvasRetry(canvasPageID) {
	Log(5, "-->CloseCanvasRetry; canvasPageID: " + canvasPageID);

	success = Radiology.CloseCanvasPage(canvasPageID, false);
	if (!success) {
		_pendingCloseCanvas = false;
		Log(1, "Error in CloseCanvasPageRetry: " + Radiology.GetLastErrorCode());
	}
	
    Log(5, "<--CloseCanvasRetry");
}


//--------------------
// iSite Events
//--------------------

function Radiology_EventViewMenuSelected(menuitem, xmlContext) {
    if (!IsRadWhereCtrlExist())
		return;

	Log(5, "-->Radiology_EventViewMenuSelected");
    if (menuitem.toString() == MENU_DICTATE_ONE)
		OnViewMenu(menuitem, xmlContext);
    Log(5, "<--Radiology_EventViewMenuSelected");
}

function Radiology_EventExamMenuSelected(menuitem, examID) {
    if (!IsRadWhereCtrlExist())
		return;

	Log(5, "-->Radiology_EventExamMenuSelected");
    if (menuitem.toString() == MENU_DICTATE_ONE)
		OnExamMenu(menuitem, examID);
    Log(5, "<--Radiology_EventExamMenuSelected");
}

//DCE-593 Added shelfID in this function to fix right mouse click on iSite PACS of an exam image issue.
function Radiology_EventShelfMenuSelected(menuitem, canvasPageID, shelfID) {
    if (!IsRadWhereCtrlExist())
		return;

	Log(5, "-->Radiology_EventShelfMenuSelected");
	if (menuitem.toString() == MENU_DICTATE_ONE)
		OnShelfMenu(menuitem, canvasPageID, shelfID);
	Log(5, "<--Radiology_EventShelfMenuSelected");
}

function Radiology_EventLogout() {
    if (!IsRadWhereCtrlExist())
		return;

	Log(5, "-->Radiology_EventLogout");
    if (_integrationMode != PREF_MASTER)
        setTimeout("LogoutRadWhereUser()", 50);
    Log(5, "<--Radiology_EventLogout");
}

function Radiology_EventPreferencesApplied() {
    if (!IsRadWhereCtrlExist())
		return;

	Log(5, "-->Radiology_EventPreferencesApplied");
    GetRadWherePreferences();
    // Log user preferences
    var mode;
    switch (_integrationMode) {
    	case PREF_SLAVE: mode = "slave";
    		break;
    	case PREF_MASTER: mode = "master";
    		break;
    	case PREF_DUAL: mode = "dual";
    		break;
    }
    Log(1, "New user preferences applied:");
    Log(1, "Integration mode: " + mode);
    Log(1, "Single sign-on: " + _singleSignOn);
    Log(1, "Logging level: " + _logLevel);
    Log(1, "Auto-load studies in PS360: " + _autoLoad);
    Log(1, "Automatically close iSite images: " + _closeStudy);
    Log(1, "Automatically close PS360 reports: " + _closeStudy360);
    Log(1, "Logging level: " + _logLevel);
    Log(1, "PS360 Launch on first study: " + _launchOnFirstStudy);
    Log(1, "Automatically link accessions: " + _autoLink);
    Log(1, "Automatically save presentation state: " + _autoSavePresentationState);
    Log(5, "<--Radiology_EventPreferencesApplied");
}

function Radiology_EventPageStatus(nameOrID, type, visible) {
    if (!IsRadWhereCtrlExist())
		return;
	// DD-4877/DCE-19 mamage Patient Lookup Click status to make sure 
	// clicking that button does not close view study tab/button
	_isPatientLookUpClick = false;
	Log(5, "-->Radiology_EventPageStatus: id=" + nameOrID + " activeCanvasPageID=" + _activeCanvasPageID + " type=" + type + " visible=" + visible + " _pendingCloseCanvas=" + _pendingCloseCanvas + " _reportClosingAccessions=" + _reportClosingAccessions);
	// DCE-2619/DD-8098 ISite dropping studies in Exam tab randomly
	if (type == "FOLDER" && nameOrID != "" && visible && _activeCanvasPageID != nameOrID) {
		_isPatientLookUpClick = true;
		Log(5, "Paient Lookup or Worklist tab clicked, setting _isPatientLookUpClick: " + _isPatientLookUpClick);
	}

	if (type == "CANVAS" && nameOrID != "" && visible && _activeCanvasPageID != nameOrID) {
	    _activeCanvasPageID = nameOrID;
	    //dng testing
	    //DCE-1736 Report Automatically Reopening When Accessions Added to Report from PS360
	    var bCallCanvasOpened = true;
	    var exam = GetMainExam();
	    var accessionArray = null;
	    if (_reportClosingAccessions != null && _reportClosingAccessions != "")
	        accessionArray = _reportClosingAccessions.split(",");
	    if (exam != null && _reportClosingAccessions != null && contains(accessionArray, exam.accession))
	    {
	        Log(5, "Skip autoload of PS360 report while closing report for the same linked accessions");
	        bCallCanvasOpened = false;
	    }
	    if (bCallCanvasOpened)
		    setTimeout(function () { OnCanvasOpened() }, 50);
		//OnCanvasOpened();
	}
	else if (type == "CANVAS" && !visible && _activeCanvasPageID == nameOrID) {
		// If we have an exam pending a PS360 launch, cancel it because the user closed the study in iSite
		if (_examPendingLaunch != null) {
		    Log(5, "Setting _examPendingLaunch = null.");
		    _examPendingLaunch = null;
		}
		// Close the study if it's still open in PS360 if the user wants it automatically closed.
		// Note - we check to see when we last attempting to close the canvas from the plugin. If it
		// was recently, we don't want to try to close the report in PS360.
		if (_closeStudy360 && !_pendingCloseCanvas) {
			// Find every exam in the active canvas, and compare with the current report opened in PS360.
			var exams = GetActiveExams();
		
			for (var i = 0; i < exams.length; i++) {
				exam = exams[i];
				
				if (isOpenInPS360(exam.accession)) {
					Log(3, "Closing report for accession: " + exam.accession);
					_isPatientLookUpClick = true;
					_pendingCloseReport = true;
					try {
						result = RadWhereCtrl.SaveReport(true);
					}
					catch (e) {
						result = false;
						Log(1, "Error: Exception occurred in SaveReport:\r\n" + e.Message);
					}
					if (result = false) {
						Log(2, "Warning: Failed to close report in PS360.");
						_pendingCloseReport = false;
					}
					break;
				}
			}
		}
		else {
			Log(5, "Skipping auto-close of PS360 report.");
		}
		Log(5, "Resetting active canvas page to zero.");
		_activeCanvasPageID = 0;
	}
	_canvasClosed = false;
    Log(5, "<--Radiology_EventPageStatus");
}

function GetURLPath(url) {
	var lastSlash = url.lastIndexOf('/');
	var lastBackSlash = url.lastIndexOf('\\');
	var pathEnd = (lastSlash > lastBackSlash) ? lastSlash : lastBackSlash;
	return url.substr(0, pathEnd + 1); 
}

function Radiology_EventShelfLoaded(canvasPageID, shelfID) {
    if (!IsRadWhereCtrlExist())
		return;

	Log(5, "-->Radiology_EventShelfLoaded");
	if (_integrationMode != PREF_MASTER) {
		// load the mic button
		bitmapPath = GetURLPath(document.URL) + "mic.gif";
		Log(5, "Loading button icon from " + bitmapPath);
		var success = Radiology.AddShelfButton(shelfID, SHELF_BUTTON_DICTATE, bitmapPath, "Dictate study");
		if (!success) {
			Log(1, "AddShelfButton failed. Error code: " + Radiology.GetLastErrorCode());
		}
    }
    Log(5, "<--Radiology_EventShelfLoaded");
}

function Radiology_EventShelfButton(buttonID, shelfID) {
    if (!IsRadWhereCtrlExist())
		return;

	Log(5, "-->Radiology_EventShelfButton; button ID:" + buttonID);
    if (buttonID == SHELF_BUTTON_DICTATE) {
		setTimeout(function() { OnShelfButton(shelfID) }, 50);
    }
    Log(5, "-->Radiology_EventShelfButton");
   }


function Radiology_EventCanvasPageClosed(canvasPageID) {
    Log(5, "-->Radiology_CanvasPageClosed; canvas page ID:" + canvasPageID + "; _pendingOpenStudyMRN: " + _pendingOpenStudyMRN + "; _pendingOpenStudyAccession: " + _pendingOpenStudyAccession + "; _pendingCloseCanvas: " + _pendingCloseCanvas);
	_canvasClosed = true;
	Log(5, "<--Radiology_CanvasPageClosed.");
}

//--------------------
// RadWhere Events
//--------------------
function OnReportOpened(siteName, accessionNumbers, status, isAddendum, plainText, richText) {
    //TTP 2405/SR 102065054
	Log(5, "-->OnReportOpened; accessions: " + accessionNumbers + ". Resetting _reportClosing = false; _currentPatientMRN: " + _currentPatientMRN);
	_currentAccessions = accessionNumbers;
	//_reportClosing = false; // We do this just in case a ReportClosed event was received for pending status, but we never received a second event because of some type of error.
	Log(5, "<--OnReportOpened");
}

function OnOpenStudy(mrn, accessions) {
    Log(5, "-->OnOpenStudy; mrn:" + mrn + "; accessions:" + accessions + "; _pendingCloseCanvas:" + _pendingCloseCanvas + "; _pendingOpenStudyMRN:" + _pendingOpenStudyMRN + "; _pendingOpenStudyAccession:" + _pendingOpenStudyAccession + "; _reportClosing:" + _reportClosing);
	// if we're in the process of closing a canvas or a report, we have to wait...
	if ((_pendingCloseCanvas || _reportClosing || _pendingCloseReport) && _pendingOpenStudyAccession == "") {
		Log(5, "Can't open study - a CloseCanvas is pending, or a report is being closed.");
		_pendingOpenStudyAccession = accessions;
		_pendingOpenStudyMRN = mrn;
	}
	else {
	    _pendingOpenStudyAccession = "";
	    _pendingOpenStudyMRN = "";
		// Load images in iSite (if not already open)
		var accessionArray = accessions.split(",");
		var accession = accessionArray[0];	// We will only use the first exam, because we don't want to open multiple canvas pages.
		var mainExam = GetMainExam();
		if (mainExam != null && contains(accessionArray, mainExam.accession)) {
			Log(3, "The study is already open in iSite.");
		}
		else {
		    //TTP 2410/SR 102135092, let pass our mrn to iSite and see if there is a match if not try without the mrn.
		    var exam = GetExamInfo(null, accession, null, mrn);
		    if (null == exam) {
		        Log(5, "OnOpenStudy; our mrn does not match iSite patientMRN. Try GetExamInfo without mrn.");
		        exam = GetExamInfo(null, accession, null);
		    }
			if (null != exam) {
			    Log(5, "Setting _pendingOpenCanvas = " + exam.accession);
			    //TTP 2405/SR 102065054, check the our mrn against iSite mrn number.
			    if (exam.patientMRN != null && exam.patientMRN != "") {
			        if (exam.patientMRN != mrn) {
			            exam = null;
			            Log(2, "Warning: OnOpenStudy->mrn does not match iSite patientMRN and will not open this study in iSite.");
			        }
			    }

			    //SR 102405236 Community Care Physicians
			    if (null != exam) {
					_pendingOpenCanvas = exam.accession;
					_pendingOpenCanvasForPR = exam.accession;
				    var canvasID = Radiology.OpenCanvasPage(exam.examID, "", true, true, false);
				    if (canvasID == "") {
					    Log(1, "ERROR: OpenCanvasPage failed; error code=" + Radiology.GetLastErrorCode());
				    }
				    Log(5, "Radiology.OpenCanvasPage(" + exam.examID + ", true, true, false); Returned canvas page id: " + canvasID);
			    }
			}
			else {
				Log(3, "The specified exam was not found in iSite.");
			}
		}
	}
    Log(5, "<--OnOpenStudy");
}

function OnReportClosed(siteName, accessionNumbers, status, isAddendum, plainText, richText) {
	/// Report Statuses for PS360:
	///		Discarded = -1. Specifies that a report was created and then discarded.
	///		Pending = 0. Specifies that the status is unknown or pending because the report is currently being saved by the application in the background.
	///		WetRead = 1. Specifies that the report status is WetRead.
	///		Draft = 2. Specifies that the report status is Draft.
	///		PendingCorrection = 3. Specifies that the report's author sent it to an editor for correction/transcription.
	///		Corrected = 4. Specifies that the report's editor is done correcting/transcribing it.
	///		CorrectionRejected = 5. Specifies that the report's author rejects the report corrected/transcribed by an editor.
	///		PendingSignature = 6. Specifies that the report was approved by the resident who dictated it, or signed as preliminary by the attending.
	///		SignRejected = 7. Specifies that the report's attending physician rejects the report approved by the resident.
	///		Final = 8. Specifies that the report status is Final, signed by an attending.
	var markStudyRead = ((_markRead == PREF_MARK_READ_SIGNED && status == 8) || (_markRead == PREF_MARK_READ_DONE));
	//TTP 2405/SR 102065054
    Log(5, "-->OnReportClosed: accession(s):" + accessionNumbers + "; pending close:" + _pendingCloseReport + "; status:" + _reportStatusNames[status] + "; mark study read:" + markStudyRead + "; close study:" + _closeStudy + "; _currentPatientMRN:" + _currentPatientMRN);
    // Ignore pending status
	if (status == 0) {
		Log(5, "Report is in pending status - setting _reportClosing = true");
		_reportClosing = true;
		_reportClosingAccessions = accessionNumbers;
    }
	else {
		_currentAccessions = "";
		_reportClosingAccessions = accessionNumbers;
	    // If the plugin closed the report, and "broadcast IRadwhere events" setting is enabled in PS360, we will
		// get here, but we don't want to attempt to close the report in iSite.
		if (_pendingCloseReport) {
			Log(5, "_pendingCloseReport = true. Restting and skipping auto-close in PS360.");
			// in this case, it might be the case where there is peer reviewed study still in iSite canvas, need to close it.
			// This is to fix the flow when Peer Review is launched on report close
			Log(5, "Show exam accession still in pending canvas  for Peer Review:  _pendingOpenCanvasForPR: " + _pendingOpenCanvasForPR);
			Log(5, "Show Patient Lookup click flag :  _isPatientLookUpClick: " + _isPatientLookUpClick);

			if (!_isPatientLookUpClick) {
				// DCE-2521/DD-7988, make sure indeed this is a peer review process
				if (_pendingOpenCanvasForPR !="" && _pendingOpenCanvasForPR != accessionNumbers) {
					// For fixing DCE-1923, launch peer review on report close
					var exam = GetExamInfo(null, _pendingOpenCanvasForPR, null);
					if ( _pendingOpenStudyAccession != "" && _pendingOpenStudyAccession == exam.accession) {
						// in this case, it is this workflow: Peer Review => Cancel => Sign 
						// => Peer Review again => OK 
						_pendingOpenStudyAccession = "";
					}

					if (exam != null ) {				
						//// These exams are previous signed reports that are picked for peer review
						Log(5, "Close peer review exam in canvas with accession: " + exam.accession);

						var canvasIdForPeerReviewStudy = "";
						// Find correct canvas by making sure the accession is a MainExam in a canvas
						canvasIdForPeerReviewStudy = GetCanvasIdFromMainExamInCanvas(_pendingOpenCanvasForPR);
						
						if (canvasIdForPeerReviewStudy != "") {
							Log(5, "Close peer review exam in canvas with accession: " + exam.accession + "; canvasPageId: " +  canvasIdForPeerReviewStudy);
							success = Radiology.CloseCanvasPage(canvasIdForPeerReviewStudy, false);
							if (!success) {
								Log(1, "Error in Peer Review CloseCanvasPage: " + Radiology.GetLastErrorCode());
							}
						}
						else {
							Log(1, "ERROR: Unable to get canvas page id for the peer review study with errorcode: " + Radiology.GetLastErrorCode());
						}
						
						if (_reportClosingAccessions != "") {
							Log(3, "OnReportClosed: process current study accession: " + _reportClosingAccessions);
							ProcessExamMarkedReadOrCloseCanvas(_reportClosingAccessions, markStudyRead, status, isAddendum)
						}
						// will close both the current report and  all studies 
						// in PACS (current and peer reviewed ones)
					}
				}
				else {
					Log(3, "OnReportClosed: it is either not an actual peer review process or a user is actually clicks other tabs (not view exam tab)");
					_isPatientLookUpClick = true;
				}
			}
			// DCE-2619/DD-8098 ISite dropping studies in Exam tab randomly
			_pendingOpenCanvasForPR = "";		
			_pendingCloseReport = false;
		}
		else {
			ProcessExamMarkedReadOrCloseCanvas(accessionNumbers, markStudyRead, status, isAddendum)
		}
        //TTP 2405/SR 102065054, SR 102334784 need to reset the _currentPatientMRN even for _pendingCloseReport report
        _currentPatientMRN = "";
        Log(5, "Setting _pendingCloseCanvas and _reportClosing = false");
		_pendingCloseCanvas = false;
		_reportClosing = false;
		_reportClosingAccessions = null;
		if (_pendingOpenStudyAccession != "") {
			if (_pendingOpenStudyAccession != accessionNumbers)
			{
				Log(5, "An OpenStudy occurred while closing the report. Calling OpenStudy again...");
				setTimeout(function () { OnOpenStudy(_pendingOpenStudyMRN, _pendingOpenStudyAccession) }, 50);
			}
			else
			{
				Log(5, "An OpenStudy with the same accessions occurred while closing the current report, don't open the same exam in iSite again");
				_pendingOpenStudyAccession = "";
			}
		}
	}
    //TTP 2405/SR 102065054
	Log(5, "<--OnReportClosed; _currentPatientMRN: " + _currentPatientMRN);
}

// Process current study canvas
function ProcessExamMarkedReadOrCloseCanvas(accessionNumbers, markStudyRead, status,isAddendum)
{
	// For each study in the report, unlock it (if opened from exam menu), mark it read,
	// and close the canvas (if specified in user prefs)
	var accessionArray = accessionNumbers.split(",");
	var success;
	for (var i = 0; i < accessionArray.length; i++) {
		//TTP 2405/SR 102065054, let's provide _currentPatientMRN for GetExamInfo() to get the correct examID.
		//var exam = GetExamInfo(null, accessionArray[i], null);
		var exam = GetExamInfo(null, accessionArray[i], null, _currentPatientMRN);
		//TTP 2405/SR 102065054
		if (null == exam || null == exam.examID) {
			Log(2, "WARNING: An exam with accession " + accessionArray[i] + " was not found in iSite. The study will not be marked read or closed in iSite.");
			continue;
		}
		else {
			//SR 102334784 log this only if examID is found
			Log(5, "OnReportClosed: accession: " + accessionNumbers + "; examID: " + exam.examID + "; shelfID: " + exam.shelfID);
		}

		// If there is no shelf ID, it means the canvas isn't opened, and we have to explicitly unlock it.
		// dng testing SR 102439410, according to iSite engineer the exam need to be lock if it is not lock before marking the exam as read. Only unlock if we are not marking the exam
		// read i.e. if markStudyRead || (_markRead != PREF_MARK_READ_DONE && status == -1) is false
		var forceLock = false;
		if (!(markStudyRead || (_markRead != PREF_MARK_READ_DONE && status == -1))) {
			if (exam.shelfID == "") {
				Log(5, "OnReportClosed: unlock examID: " + exam.examID);
				Radiology.LockExam(exam.examID, false);
			}
		} else {
			// Check if the exam is lock or no lock, if no lock then lock it first before mark read.
			if (!exam.isLocked) {
				Log(5, "OnReportClosed: force Lock examID: " + exam.examID);
				Radiology.LockExam(exam.examID, true);
				forceLock = true;
			}
		}
		var read = status > 0;
		if (markStudyRead && _closeStudy && read && exam.shelfID != "") {
			// If the study was read, and we need to close it, we can use the MarkExamRead function.
			// Save any annotations, etc. using SavePresentationState. If there is no shelf ID, 
			// we don't have to do this because the canvas isn't open.
			if (_autoSavePresentationState) {
				Log(3, "Radiology.SavePresentationState(" + exam.shelfID + ")");
				success = Radiology.SavePresentationState(exam.shelfID, exam.accession, 2);
				if (!success) {
					Log(1, "Error in SavePresentationState: " + Radiology.GetLastErrorCode());
				}
			}
			// There are different issues, iSite crash (DCE 867) and iSite study not closed after report signed in PS360 (DCE-1340)
			// Taking Lokesh suggestion not to call MarkExamRead if the exam already mark read.
			if (exam.isRead) {
				// Exam already mark read, just close the canvas
				Log(3, "Exam already marked read. Just call CloseCanvasPage.");
				CloseCanvas(exam);
			}
			else {
				// MarkExamRead will mark it as read automatically close the canvas
				_pendingCloseCanvas = true;

				var examStatus = _examStatusNames[exam.status];
				if (examStatus != "" && examStatus.toLowerCase() == "finalized") {
					// DCE-2531/DD-7995 according to iSite engineer Sarah Doege, for "Finalized" exam, SetMarkRead API method
					// followed by a close canvas call is needed to mark the study read and close the canvas
					Log(3, "Radiology.SetMarkRead(" + exam.examID + ")");
					success = Radiology.SetMarkRead(exam.examID, true);
					if (!success)
						Log(1, "Error setting exam read. Error code: " + Radiology.GetLastErrorCode());
					CloseCanvas(exam)
				}
				else {
					Log(3, "Radiology.MarkExamRead(" + exam.examID + ")");
					
					if (!Radiology.MarkExamRead(exam.examID)) {
						// If MarkExamRead fail, log the error code for debug and close the canvas.
						_pendingCloseCanvas = false;
						var errorCode = Radiology.GetLastErrorCode();
						// DCE 857/SR 102563898 SCRIPPS HEALTH - PACS iSite Crash when Exams are linked in PS360
						// According to iSite engineer Lokesh calling both MarkExamRead and CloseCanvasPage in sequence sometimes it may cause iSite to crash in SCRIPPS HEALTH when
						// the user linked another accession to the report in PS360. Also MarkExamRead will close exam and save presentation state, remove CloseCanvas here.
						Log(1, "Error marking exam read: " + errorCode);
					//DD-3599 / DCE-1536
						//CloseCanvas(exam);
					}
				}
			}
		}
		else {
			Log(3, "OnReportClosed: marking the study un-read because the report was discarded, or...");
			// If we get here, we're either:
			//	a. marking the study un-read because the report was discarded, or...
			//  b. marking it read without closing the canvas, or...
			//  c. closing the canvas without marking it read
			if (markStudyRead || (_markRead != PREF_MARK_READ_DONE && status == -1)) {
				//SR 102053112, only mark the study read if this report is not an addendum. User don't want the study mark un-read if the report is discarded and it is
				//an addendum. 
				if (isAddendum) {
					Log(3, "Don't unmark the study if discarded report is an addendum.");
				} 
				//else if (status == -1) {    //DCE-1573
				//    			    //dng testing, don't mark study if user discard the report on PS360
				//        Log(3, "Don't unmark the study if discarded report.");
				//}
				else {
					Log(3, "Radiology.SetMarkRead(" + exam.examID + "," + read + ")");
					try {
						success = Radiology.SetMarkRead(exam.examID, read);
						if (!success)
							Log(1, "Error marking exam read. Error code: " + Radiology.GetLastErrorCode());
					}
					catch (e) {
						Log(1, "Exception occurred marking exam read: " + e.Message);
					}
				}
			}
			if (_closeStudy && exam.shelfID != "") {
				CloseCanvas(exam);
			}
		}
		//dng testing SR 102439410, put back the original lock state
		if (forceLock) {
			Log(5, "OnReportClosed: force unlock examID: " + exam.examID);
			Radiology.LockExam(exam.examID, false);
		}
	}
	// DCE-2598, prevent study closing when navigating to worklist or other tabs
	Log(5, "Setting _pendingOpenCanvasForPR = ''");
	_pendingOpenCanvasForPR = ""; 
}
// Get Canvas ID associated with a Main Exam
function GetCanvasIdFromMainExamInCanvas(accession)
{
	Log(5, "-->GetCanvasIdFromMainExamInCanvas" + "; accession in canvas: " + accession);
	if (accession !="") {
		var exam = GetExamInfo(null, accession, null);
		if ( exam != null) {
			var shelfIDs = Radiology.FindShelfID(exam.examID);
			Log(5, "GetCanvasIdFromMainExamInCanvas: SheldIds: " + shelfIDs);
			if (shelfIDs != "") {
				var doc = xmldso.XMLDocument;
				doc.loadXML(shelfIDs);
				var nodeList = doc.getElementsByTagName("ShelfIDs");
				var idList = nodeList.item(0).getElementsByTagName("ID");
				for (var i = 0; i < idList.length; i++) {
					var shelfID = idList.item(i).text;
					if (shelfID != "") {	
						var shelfStatus = Radiology.GetShelfStatus(shelfID);
						Log(5, "Shelf status:\r\n" + shelfStatus);
						if (shelfStatus != "") {
							doc.loadXML(shelfStatus);
							nodeList = doc.getElementsByTagName("ShelfStatus");
							if (nodeList != null) {
								var isMainExam = false;
								isMainExam = nodeList.item(0).selectSingleNode("MainExam").text == "1" ? true : false;
								var currentCanvasId = nodeList.item(0).selectSingleNode("CanvasPageID").text;
								if (isMainExam) {
									Log(5, "<--GetCanvasIdFromMainExamInCanvas: SheldId: " + shelfID + ", IsMainExam: " + isMainExam + ", CanvasPageiD: " + currentCanvasId);								
									return  currentCanvasId;
								}
								Log(5, "GetCanvasIdFromMainExamInCanvas: SheldId: " + shelfID + ", IsMainExam: " + isMainExam + ", CanvasPageiD: " + currentCanvasId);	
							}
						}
					}
				}
			}
		}
	}
	Log(5, "<--GetCanvasIdFromMainExamInCanvas");
	return "";
}
function OnAccessionNumbersChanged(siteName, accessionNumbers, status, isAddendum, plainText, richText) {
	Log(5, "-->OnAccessionNumbersChanged: previous accession(s): " + _currentAccessions + "; new accessions: " + accessionNumbers );
	if (_currentAccessions != "") {
		// If an accession has been dissociated from the report, and that accession is the 
		// "main" exam in iSite, we need to close the report and make them start over in the work list.
		// If we don't, we lose context and the user could dictate for the wrong study.
		var newAccessions = accessionNumbers.split(",");
		var previousAccessions = _currentAccessions.split(",");
		_currentAccessions = accessionNumbers;
		var mainExam = null;	// Don't retreive this info unless we need to (if an accession has been dissociated)
		for (var i=0; i < previousAccessions.length; i++) {
			// Look for an accession that exists in our list of previous accessions, 
			// but doesn't exist in the new list.
			if (!contains(newAccessions, previousAccessions[i])) {
				if (null == mainExam) {
					// Now we can retreive the open exams in iSite.
					mainExam = GetMainExam();
					Log(5, "An accession was dissociated from the report: " + previousAccessions[i]);
				}
				if (null == mainExam) {
					Log(3, "WARNING: the main exam could not be found in the active canvas page, id=" + _activeCanvasPageID + ".");
				}
				else {
					// Look for the dissociated exam in iSite
					Log(5, "The main exam open in iSite is for accession: " + mainExam.accession);
					if (mainExam.accession == previousAccessions[i]) {
						Log(3, "The user dissociated the main exam: " + mainExam.accession + ". Closing canvas in iSite...");
						//Radiology.MessageBox("The main exam was dissociated from the report in PowerScribe 360 (accession " + mainExam.accession + "). The main exam canvas page will now be closed.", MB_OK | MB_ICONWARNING);
						CloseCanvas(mainExam);
						if (_closeStudy360 == true) {
							_pendingCloseReport = true;
							try {
								result = RadWhereCtrl.SaveReport(true);
							}
							catch (e) {
								result = false;
								Log(1, "Error: Exception occurred in SaveReport:\r\n" + e.Message);
							}
							if (result = false) {
								Log(2, "Warning: Failed to close report in PS360.");
								_pendingCloseReport = false;
							}
						}
					}
				}
			}
		}
	}
	Log(5, "<--OnAccessionNumbersChanged");
}

function OnUserLoggedOut(userName) {
	Log(5, "-->OnUserLoggedOut; user: " + userName);
	Log(5, "<--OnUserLoggedOut");
}

function OnUserLoggedIn(userName) {
	Log(5, "-->OnUserLoggedIn; user: " + userName);
	// if login was performed asynchronously, check to see if we need to open a report.
	Log(5, "_minimized: " + _minimized);
	if (_minimized)
		RadWhereCtrl.Minimized = true;
	if (_launching) {
	    Log(5, "Setting _launching = false. Asynchronous launch complete.");
	    _launching = false;
		if (null != _examPendingLaunch) {
			var exam = _examPendingLaunch;
			_examPendingLaunch = null; 
			Log(3, "User was logged in after asynchronous launch, during which time a study was opened in iSite. Opening a report for accession " + exam.accession);
			setTimeout(function () { RadWhereDictate(exam); }, 50); 
		}
	}
    Log(5, "<--OnUserLoggedIn");
}

function OnTerminated() {
    Log(5, "-->OnTerminated");
    _connected = false;
    Log(5, "<--OnTerminated");
}

function OnLaunched() {
	Log(5, "-->OnLaunched");
	_connected = true;
	if (_integrationMode != PREF_SLAVE)
		RadWhereCtrl.StartListening();
	if ("" == _user) {
	    Log(5, "Setting _launching = false. User login was not requested.");
	    _launching = false; // login was not requested - we're done. 
	}
	else {
		// DCE-2616/DD-8084 resolve an issue when PS is launched and logged in first,
		// ISR is launched after that, the integration would not work because it considers
		// an open PS session is not allowed
		var isLoggedIn= false;
		isLoggedIn = RadWhereCtrl.LoggedIn;
		Log(5, "isLoggedIn: " + isLoggedIn);
		if (isLoggedIn)
		{
			var psUserName = RadWhereCtrl.Username;
			Log(5, "psUserName: " + psUserName + ", iSite Username for PS: " + _user);
			if (psUserName)
			{
				var iSiteUser = Radiology.GetCurrentUser();
				Log(5, "iSiteUser: " + iSiteUser);
				if (psUserName.toLowerCase() == _user.toLowerCase()) {
					// usernames match, PS already launched and logged in with a correct username
					_launching = false;
				}
				else if (iSiteUser && psUserName.toLowerCase() == iSiteUser.toLowerCase()) {
					// usernames match, PS already launched and logged in with a matching iSIte username
					_launching = false;
				}
				else
				{
					alert('There is a mismatch of iSite and PowerScribe users. Please make sure usernames match!');
					Log(2, "Warning: iSite and PowerScriber usernames mismatch");
            		return;
				}	
			}
		}
	}
	if (!_launching) {
	    Log(5, "Asynchronous launches complete, check if there are pending studies to open in PS");
		if (null != _examPendingLaunch) {
			var exam = _examPendingLaunch;
			_examPendingLaunch = null; 
			Log(3, "User did wait for asynchronous launch, but during which time a study was opened in iSite. Opening a report for accession " + exam.accession);
			setTimeout(function () { RadWhereDictate(exam); }, 50); 
		}
	}
	Log(5, "<--OnLaunched");
}