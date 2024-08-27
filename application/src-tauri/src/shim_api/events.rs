use serde::{de::{value::Error, Visitor}, Deserialize, Serialize};

use super::{commons::{CanvasPageID, ShelfID}, query::ShimQuery};

#[derive(Clone, Debug, PartialEq, Deserialize)]
pub(crate) struct NumericalBoolean {
    value:bool
}

impl std::fmt::Display for NumericalBoolean
{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.value.fmt(f)
    }
}

impl Serialize for NumericalBoolean
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer {
        let numerical_value = match self.value
        {
            false=>0,
            true=>1
        };

        serializer.serialize_i16(numerical_value)
    }
}

impl<'de> Visitor<'de> for NumericalBoolean {
    type Value=bool;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("an i16")
    }

    fn visit_i16<E>(self, value: i16) -> Result<Self::Value, E>
    where
        E: serde::de::Error,
    {
        let bool_value = match value
        {
            0=>false,
            1=>true,
            other=>{return Err(serde::de::Error::invalid_value(
                serde::de::Unexpected::Signed(other.into()), 
                &self
            ));}
        };

        Ok(bool_value)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub(crate) enum ShimEvent {
    Debug(String),
    PageStatus(CanvasPageID, ShelfID, NumericalBoolean), //RadiologyEventShelfLoaded
    Logout(String),
    QueryResult(ShimQuery)
}

#[cfg(test)]
mod tests {
    use super::{NumericalBoolean, ShimEvent};
    use crate::shim_api::commons::test_serialization;

    #[test]
    fn test_event_package_serialization() {
        test_serialization(vec![
            ShimEvent::Debug("Testing debug.".to_string()),
            ShimEvent::PageStatus(
                "TestCanvasID".to_string(),
                "TestShelfID".to_string(),
                NumericalBoolean{value:true}
            )
        ]
        );
    }
}
