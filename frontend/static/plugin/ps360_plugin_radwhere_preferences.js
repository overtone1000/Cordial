// MessageBox parameter constants
var MB_OK = 0x00000000;
var MB_OKCANCEL = 0x00000001;
var MB_ABORTRETRYIGNORE = 0x00000002;
var MB_YESNOCANCEL = 0x00000003;
var MB_YESNO = 0x00000004;
var MB_RETRYCANCEL = 0x00000005;
var MB_ICONHAND = 0x00000010;
var MB_ICONQUESTION = 0x00000020;
var MB_ICONEXCLAMATION = 0x00000030;
var MB_ICONASTERISK = 0x00000040;
var MB_ICONWARNING = MB_ICONEXCLAMATION;
var MB_ICONERROR = MB_ICONHAND;
var MB_ICONINFORMATION = MB_ICONASTERISK;
var MB_ICONSTOP = MB_ICONHAND;

// MessageBox return codes
var IDOK = 1;
var IDCANCEL = 2;
var IDABORT = 3;
var IDRETRY = 4;
var IDIGNORE = 5;
var IDYES = 6;
var IDNO = 7;
var IDCLOSE = 8;

//preference tag constants
var PREFS_NAME = "Powerscribe360 Preferences";
var PREFS_TYPE = "User"
var PREF_ROOT = "RadWherePreferences";
var PREF_SEND_STATUS_TAG = "RadWhereSendStatus";
var PREF_MARK_READ_TAG = "MarkRead";
var PREF_AUTO_LOAD_TAG = "RadWhereAutoLoad";
var PREF_SIGNON_TAG = "SingleSignOn";
var PREF_MODE_TAG = "IntegrationMode";
var PREF_USER_TAG = "RadWhereUser";
var PREF_PASSWORD_TAG = "RadWherePassword";
var PREF_LOG_ENABLED = "LoggingEnabled";
var PREF_LOG_DIRECTORY = "LogDirectory";
var PREF_LOG_LEVEL = "LogLevel";
var PREF_LAUNCH_ON_FIRST_STUDY_TAG = "LaunchOnFirstStudy";
var PREF_CLOSE_STUDY_TAG = "CloseStudy";
var PREF_CLOSE_STUDY_360_TAG = "CloseStudy360";
var PREF_MINIMIZED_TAG = "Minimized"
var PREF_AUTOLINK_TAG = "AutoLink"
var PREF_AUTOSAVEPRESENTATIONSTATE_TAG = "AutoSavePresentationState";
//other constants
var PREF_TRUE = "true";
var PREF_FALSE = "false";
var PREF_MARK_READ_DONE = 0;
var PREF_MARK_READ_SIGNED = 1;
var PREF_MARK_READ_NEVER = 2;
var PREF_SLAVE = "0";
var PREF_MASTER = "1";
var PREF_DUAL = "2";
var PREF_AUTO_LOAD_NEVER = 0;
var PREF_AUTO_LOAD_ALWAYS = 1;
var PREF_AUTO_LOAD_NOT_IN_FINAL = 2;
var MENU_DICTATE = "Powerscribe360: Dictate"
var MENU_DICTATE_ONE = MENU_DICTATE + " this exam."
var MENU_DICTATE_ALL = MENU_DICTATE + " all open exams for this patient."
var RW_PLUGIN_VERSION = "Version 5.0.25";
var SHELF_BUTTON_DICTATE = "Dictate";

// variables
var _autoLoad = PREF_AUTO_LOAD_NEVER;
var _markRead = PREF_MARK_READ_DONE;
var _closeStudy = true;
var _closeStudy360 = true;
var _singleSignOn = false;
var _integrationMode = PREF_DUAL;
var _user = "";
var _password = "";
var _logEnabled = false;
var _logDirectory = "";
var _logLevel = "5";
var _modified = false;
var _connected = false;
var _launchOnFirstStudy = false;
var _minimized = false;
var _autoLink = false;
var _autoSavePresentationState = true;

// Retrieve XML string of preferences
function GetRadWherePreferences() {
    var xmlstring;
    xmlstring = Radiology.GetPreference(PREFS_NAME, PREFS_TYPE);
    if (xmlstring != "") {
        var doc = xmldso.XMLDocument;
        var root = doc.documentElement;
        var nodeList = doc.getElementsByTagName(PREF_ROOT);
        var elem;
        
        doc.loadXML(xmlstring);
        //alert("getting preferences:\r\n:" + xmlstring);
        
        elem = nodeList.item(0).getElementsByTagName(PREF_SEND_STATUS_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _markRead = elem.item(0).text == PREF_TRUE ? PREF_MARK_READ_DONE : PREF_MARK_READ_NEVER;

        elem = nodeList.item(0).getElementsByTagName(PREF_MARK_READ_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _markRead = elem.item(0).text;

        elem = nodeList.item(0).getElementsByTagName(PREF_AUTO_LOAD_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0) {
            _autoLoad = elem.item(0).text;
            //SR 102347054
            if (_autoLoad == PREF_TRUE)
                _autoLoad = PREF_AUTO_LOAD_ALWAYS;
            else if (_autoLoad == PREF_FALSE)
                _autoLoad = PREF_AUTO_LOAD_NEVER;
        }

        elem = nodeList.item(0).getElementsByTagName(PREF_SIGNON_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _singleSignOn = elem.item(0).text == PREF_TRUE ? true : false;

        elem = nodeList.item(0).getElementsByTagName(PREF_MODE_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _integrationMode = elem.item(0).text;

        elem = nodeList.item(0).getElementsByTagName(PREF_USER_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _user = elem.item(0).text;

        elem = nodeList.item(0).getElementsByTagName(PREF_PASSWORD_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _password = elem.item(0).text;

        elem = nodeList.item(0).getElementsByTagName(PREF_LOG_ENABLED);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _logEnabled = elem.item(0).text == PREF_TRUE ? true : false;

        elem = nodeList.item(0).getElementsByTagName(PREF_LOG_DIRECTORY);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _logDirectory = elem.item(0).text;

        elem = nodeList.item(0).getElementsByTagName(PREF_LOG_LEVEL);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _logLevel = elem.item(0).text;

        elem = nodeList.item(0).getElementsByTagName(PREF_LAUNCH_ON_FIRST_STUDY_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _launchOnFirstStudy = elem.item(0).text == PREF_TRUE ? true : false;

        elem = nodeList.item(0).getElementsByTagName(PREF_CLOSE_STUDY_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
            _closeStudy = elem.item(0).text == PREF_TRUE ? true : false;

        elem = nodeList.item(0).getElementsByTagName(PREF_CLOSE_STUDY_360_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0)
        	_closeStudy360 = elem.item(0).text == PREF_TRUE ? true : false;

        elem = nodeList.item(0).getElementsByTagName(PREF_MINIMIZED_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0) {
            _minimized = elem.item(0).text == PREF_TRUE ? true : false;
        }
        else {
            _minimized = (_integrationMode == PREF_SLAVE);
        }

        elem = nodeList.item(0).getElementsByTagName(PREF_AUTOLINK_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0) {
        _autoLink = elem.item(0).text == PREF_TRUE ? true : false;
        }
        else {
			_autoLink = false;
        }

        elem = nodeList.item(0).getElementsByTagName(PREF_AUTOSAVEPRESENTATIONSTATE_TAG);
        if (elem != null && elem.length > 0 && elem.item(0).text.length > 0) {
            _autoSavePresentationState = elem.item(0).text == PREF_TRUE ? true : false;
        }
        else {
            _autoSavePresentationState = true;
        }

    }
}
