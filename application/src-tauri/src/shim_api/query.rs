use serde::{Deserialize, Serialize};

const ESCAPED_QUOTE:&str = "\"";
pub(crate) mod fields
{
    pub(crate) const ACCESSION:&str = "x00080050";
    pub(crate) const MRN:&str = "x00100020";
    pub(crate) const STUDYDTTM:&str = "StudyDTTM";
}

/*
These are serialized into literal strings, so their names need to be exactly these four strings in all caps
or else a custom serialization would have to be implemented.
*/
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub(crate) enum QueryType {
    INTERPRETATION,
    LOOKUP,
    EXCEPTION,
    REFERRING,
}


#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub(crate) struct ShimQuery
{
    query_string:String,
    query_type:QueryType,
    max_results:u64
}

impl ShimQuery
{
    pub(crate) fn by_mrn_and_accession(mrn:&str,accession:&str)->ShimQuery
    {
        let query_str = 
        "".to_string() +
        fields::ACCESSION + " = " + ESCAPED_QUOTE + accession + ESCAPED_QUOTE +
        " AND " +
        fields::MRN + " = " + ESCAPED_QUOTE + mrn + ESCAPED_QUOTE;

        ShimQuery{
            query_string: query_str,
            query_type: QueryType::INTERPRETATION,
            max_results: 1000 //max is 1000 per documentation
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub(crate) struct GID
{
    label:String,
    value:String
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub(crate) struct Exam
{
    patient_name:String,
    medical_record_number:String,
    accession:String,
    patient_sex:String,
    study_date_time:chrono::NaiveDateTime,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub(crate) struct QueryResult
{
    matches:u64,
    returns:u64,
    exams:Vec<Exam>
}
//Example:
/*
<QueryResult>\r\n\t\t
    <TotalMatches>1</TotalMatches>\r\n\t\t
    <TotalReturns>1</TotalReturns>\r\n\t
    <ExamList>\r\n\t
        <Exam>\r\n\t
            <GID>\r\n\t\t
                <GIDLabel>SSN</GIDLabel>\r\n\t\t
                <GIDValue></GIDValue>\r\n\t
            </GID>\r\n\t\t
            <x00100010>TEST^DUMMY^^^</x00100010>\r\n\t\t
            <x00100020>2150241</x00100020>\r\n\t\t
            <x00100030>20010101</x00100030>\r\n\t\t
            <x00100040>M</x00100040>\r\n\t\t
            <StudyDTTM>2022-07-26 11:51:00</StudyDTTM>\r\n\t\t
            <x00080050>2103TEST</x00080050>\r\n\t\t
            <x00080090>^^^^</x00080090>\r\n\t\t
            <x00180015>CHST</x00180015>\r\n\t\t
            <x00080060>CR</x00080060>\r\n\t\t
            <x00081032_1>DXR7102</x00081032_1>\r\n\t\t
            <x00081032_2>XR CHEST 2 VIEWS</x00081032_2>\r\n\t\t
            <x00081080></x00081080>\r\n\t\t
            <IsStatExamFLAG>N</IsStatExamFLAG>\r\n\t\t
            <IDXExamStatus>I</IDXExamStatus>\r\n\t\t
            <LockStatus>Y</LockStatus>\r\n\t\t
            <LockedByName>David C Harrison</LockedByName>\r\n\t\t
            <PatientLocation></PatientLocation>\r\n\t\t
            <HasImagesFLAG>Y</HasImagesFLAG>\r\n\t\t
            <IDXIntReferringPhysID></IDXIntReferringPhysID>\r\n\t\t
            <IDXIntPatientID>426c9894-7e34-e711-8c28-005056abfe08:fde5ab9e-7e34-e711-8c28-005056abfe08</IDXIntPatientID>\r\n\t\t
            <IDXIntExamID>74328594-0483-3cae-62d5-3a05b9be0b3d</IDXIntExamID>\r\n\t\t
            <OrganizationCode>SALEM</OrganizationCode>\r\n\t\t
            <SubspecialityCode>THORACIC</SubspecialityCode>\r\n\t\t
            <ExamReadFLAG>N</ExamReadFLAG>\r\n\t\t
            <PerformingResource></PerformingResource>\r\n\t\t
            <HasReports>N</HasReports>\r\n\t\t
            <SiteId></SiteId>\r\n\t\t
            <NoteIndicatorCode>NONE</NoteIndicatorCode>\r\n\t\t
            <IsNIAMRExam>N</IsNIAMRExam>\r\n\t
        </Exam>\r\n\t
    </ExamList>\r\n
</QueryResult>
 */

 #[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub(crate) struct ShimQueryResult
{
    query:ShimQuery,
    results:QueryResult
}

#[cfg(test)]
mod tests {

    #[test]
    fn test_query_parsing() {
        
    }
}
