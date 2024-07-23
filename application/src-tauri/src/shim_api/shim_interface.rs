use serde::{Deserialize, Serialize};

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
    Query(QueryString, QueryType, u32),
}

#[cfg(test)]
mod tests {
    use super::ShimFunction;
    use crate::shim_api::commons::test_serialization;

    #[test]
    fn test_query() {
        test_serialization(ShimFunction::Query(
            "<XML Query String Goes Here>".to_string(),
            super::QueryType::INTERPRETATION,
            1000000, //max results
        ));
    }
}
