use serde::{Deserialize, Serialize};

use super::query::ShimQuery;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub(crate) enum ShimCall {
    Handshake,
    Query(ShimQuery),
}

//pub(crate) type ShimCallPackage = Vec<ShimCall>;

#[cfg(test)]
mod tests {
    use super::ShimCall;
    use crate::shim_api::{commons::test_json_serialization, query::ShimQuery};

    #[test]
    fn test_function_package_serialization() {
        test_json_serialization(
            ShimCall::Query(
                ShimQuery::by_mrn_and_accession("MRN_GOES_HERE", "ACCESSION_GOES_HERE")
            )
        );
    }
}
