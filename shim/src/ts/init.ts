type Radiology_Interface = import("./.d.ts").Radiology_Interface;
declare var Radiology: Radiology_Interface;

function OnLoad() {
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
}

function OnUnload() {

}

function QueryMRN(mrn) {
    var str = "x00100020 = \"" + mrn + "\"";
    RadiologyQuery(str);
}

//The ones that lead with x are clearly DICOM flags
//x00080050 is accession
//x00100020 ix MRN
//x00100010 is patient name in DICOM format
//x00100030 is birthday in the format YYYYMMDD
//x00100040 Male or Female (contains M or F)
//StudyDTTM is the "Exam Date/Time" not the scheduled date time.
//x00080050 is another number
//x00080060 looks like modality (ignored by rotation tool)
//x00081032_1 is the exam code like in rotation tool
//x00081032_2 is the exam description
//IsStatExamFLAG says whether it's stat
//IDXExamStatus gives its read status
//LockStatus gives whether it's locked
//PatientLocation gives a location...is this what's in rotation tool?
//HasImagesFLAG
//IDXIntPatientID is some longer code. Is this the Intellispace specific one? API docs discuss it.
//IDXIntExamID is some longer code. Is this the Intellispace specific one? API docs discuss it.
//OrganizationCode this is the one that shows up in powerscribe, looks different from what's in rotation tool
//ExamReadFLAG
//PerformingResource
//HasReports
//SiteId is unfortunately blank
//IsNIAMRExam is a yes no field of some kind

function Query(mrn, accession) {
    var str;
    if (mrn !== undefined && mrn !== null && mrn !== "")
        str = "x00080050 = \"" + accession + "\" AND x00100020 = \"" + mrn + "\"";
    else
        str = "x00080050 = \"" + accession + "\"";
    RadiologyQuery(str);
}

//From PS360 plugin, should refactor
function RadiologyQuery(query) {
    Shim_Debug("Query string: " + query);

    var examNode = null;
    var queryResults = Radiology.Query(query, "INTERPRETATION", 1);
    if (queryResults === "") {
        var error = Radiology.GetLastErrorCode();
        Shim_Debug("Radiology error: " + error);
    }
    else {
        Shim_Debug("Got query response:" + JSON.stringify(queryResults));
    }
    return examNode;
}