//Fields in radiology query
//x00080050 is accession
//x00100020 is MRN
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

var ACCESSION_FIELD = "x00080050";
var MRN_FIELD = "x00100020";
var STUDYDTTM_FIELD = "StudyDTTM";

function QueryMRN(mrn) {
    var str = MRN_FIELD + " = \"" + mrn + "\"";
    RadiologyQuery(str);
}

//Probably the best way to handle multiple sites.
function Query(mrn:string, accession:string) {
    var str;
    if (mrn !== undefined && mrn !== null && mrn !== "")
        str = "x00080050 = \"" + accession + "\" AND x00100020 = \"" + mrn + "\"";
    else
        str = "x00080050 = \"" + accession + "\"";
    RadiologyQuery(str);
}

//From PS360 plugin, should refactor
function RadiologyQuery(query:string) {
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