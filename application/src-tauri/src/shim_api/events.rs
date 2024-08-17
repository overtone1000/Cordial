use serde::{Deserialize, Serialize};

use super::{commons::{CanvasPageID, ShelfID}, query::ShimQuery};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub(crate) enum ShimEvent {
    Debug(String),
    PageStatus(CanvasPageID, ShelfID), //RadiologyEventShelfLoaded
    Logout(String),
    QueryResult(ShimQuery)
}

#[cfg(test)]
mod tests {
    use super::ShimEvent;
    use crate::shim_api::commons::test_serialization;

    #[test]
    fn test_event_package_serialization() {
        test_serialization(vec![
            ShimEvent::Debug("Testing debug.".to_string()),
            ShimEvent::PageStatus(
                "TestCanvasID".to_string(),
                "TestShelfID".to_string(),
            )
        ]
        );
    }
}
