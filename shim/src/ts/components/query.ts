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

//import { Shim_Debug } from "./shim_event_sender"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.
//import { Radiology } from "./init"; //Typescript doesn't handle imports in a way that is comaptible with the target platform of Mozilla 4.


type QueryType = "INTERPRETATION" | "LOOKUP" | "EXCEPTION" | "REFERRING";

interface Query
{
    query_string:string,
    query_type:QueryType,
    max_results:number //1000000 is the max result
}


//Probably the best way to handle multiple sites.
/*
function Query(data:QueryData) : void {

    if (data.mrn === undefined && data.accession == undefined)
    {
        Shim_Debug("Empty query.");
        return;
    }
    var str;
    if (data.mrn !== undefined && data.mrn !== null && data.mrn !== "")
        str = "x00080050 = \"" + data.accession + "\" AND x00100020 = \"" + data.mrn + "\"";
    else
        str = "x00080050 = \"" + data.accession + "\"";
    
    data.result=RadiologyQuery(str, data.query_type);
}
*/
//From PS360 plugin, should refactor
function RadiologyQuery(
    query:Query,
    //query:string, 
    //query_type:QueryType, 
    //max_results:number 
    ) : string {
    Shim_Debug("Query string: " + query);

    var queryResults = Radiology.Query(query.query_string, query.query_type, query.max_results);
    if (queryResults === "") {
        var error = Radiology.GetLastErrorCode();
        Shim_Debug("Radiology error: " + error);
    }
    else {
        Shim_Debug("Got query response:" + JSON.stringify(queryResults));
    }

    return queryResults;
}