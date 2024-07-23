use serde::{Deserialize, Serialize};

use super::commons::{CanvasPageID, ShelfID};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub(crate) enum ShimEvent {
    Heartbeat,
    Debug(String),
    RadiologyEventShelfLoaded(CanvasPageID, ShelfID),
}
#[cfg(test)]
mod tests {
    use super::ShimEvent;
    use crate::shim_api::commons::test_serialization;

    #[test]
    fn test_debug() {
        test_serialization(ShimEvent::Debug("Testing debug.".to_string()));
    }

    #[test]
    fn test_heartbeat() {
        test_serialization(ShimEvent::Heartbeat);
    }

    #[test]
    fn test_radiology_event_shelf_loaded() {
        test_serialization(ShimEvent::RadiologyEventShelfLoaded(
            "TestCanvasID".to_string(),
            "TestShelfID".to_string(),
        ));
    }
}
