use serde::{Deserialize, Serialize};

type CommunicationID = u64;
type QueryString = String;

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
#[serde(rename_all = "lowercase")]
pub(crate) enum ShimFunction {
    Query(CommunicationID, QueryString, QueryType, u32),
}

pub(crate) type ShimFunctionPackage = Vec<ShimFunction>;

#[cfg(test)]
mod tests {
    use super::ShimFunction;
    use crate::shim_api::commons::test_serialization;

    #[test]
    fn test_function_package_serialization() {
        test_serialization(vec![
            ShimFunction::Query(
                51,
                "<XML Query String Goes Here>".to_string(),
                super::QueryType::INTERPRETATION,
                1000000, //max results
            ),
            ShimFunction::Query(
                80,
                "<XML Query String 2 Goes Here>".to_string(),
                super::QueryType::INTERPRETATION,
                1000000, //max results
            )
        ]
        );
    }
}
