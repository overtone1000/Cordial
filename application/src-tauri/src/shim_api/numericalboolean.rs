use serde::{de::Visitor, Deserialize, Deserializer, Serialize};


#[derive(Clone, Debug, PartialEq)]
pub(crate) struct NumericalBoolean {
    value:bool
}

impl NumericalBoolean {
    pub fn new(value:bool)->NumericalBoolean
    {
        NumericalBoolean
        {
            value:value
        }
    }
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
        let numerical_value:i64 = match self.value
        {
            false=>0,
            true=>1
        };

        serializer.serialize_i64(numerical_value)
    }
}

struct NumericalBooleanVisitor;
impl<'de> Visitor<'de> for NumericalBooleanVisitor {
    type Value=NumericalBoolean;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("either 0 or 1 as an i64 or u64 (serde_json only deals with 64-bit integers, so u64 and i64 are the only options; 0 and positive numbers will default to u64)")
    }

    fn visit_i64<E>(self, value: i64) -> Result<Self::Value, E>
    where
        E: serde::de::Error,
    {
        let bool_value = match value
        {
            0=>false,
            1=>true,
            other=>{
                return Err(serde::de::Error::invalid_value(
                serde::de::Unexpected::Signed(other.into()), 
                &self
            ));}
        };

        Ok(NumericalBoolean::new(bool_value))
    }

    fn visit_u64<E>(self, value: u64) -> Result<Self::Value, E>
    where
        E: serde::de::Error,
    {
        let bool_value = match value
        {
            0=>false,
            1=>true,
            other=>{
                return Err(serde::de::Error::invalid_value(
                serde::de::Unexpected::Unsigned(other.into()), 
                &self
            ));}
        };

        Ok(NumericalBoolean::new(bool_value))
    }
}

impl<'de> Deserialize<'de> for NumericalBoolean {
    fn deserialize<D>(deserializer: D) -> Result<NumericalBoolean, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_i64(NumericalBooleanVisitor ) //JSON uses 64 bit regardless.
    }
}