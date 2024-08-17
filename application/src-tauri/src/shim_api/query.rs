use serde::{Deserialize, Serialize};

const ACCESSION_FIELD:&str = "x00080050";
const MRN_FIELD:&str = "x00100020";
const STUDYDTTM_FIELD:&str = "StudyDTTM";
const QUOTE:&str = "\"";
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
        ACCESSION_FIELD + " = " + QUOTE + accession + QUOTE +
        " AND " +
        MRN_FIELD + " = " + QUOTE + mrn + QUOTE;

        ShimQuery{
            query_string: query_str,
            query_type: QueryType::INTERPRETATION,
            max_results: 1000000 //max
        }
    }
}
