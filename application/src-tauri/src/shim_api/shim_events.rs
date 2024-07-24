use serde::{Deserialize, Serialize};

use super::commons::{CanvasPageID, ShelfID};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub(crate) enum ShimEvent {
    Poll,
    Debug(String),
    RadiologyEventShelfLoaded(CanvasPageID, ShelfID),
}

pub(crate) type ShimEventPackage = Vec<ShimEvent>;

#[cfg(test)]
mod tests {
    use super::ShimEvent;
    use crate::shim_api::commons::test_serialization;

    #[test]
    fn test_event_package_serialization() {
        test_serialization(vec![
            ShimEvent::Poll,
            ShimEvent::Debug("Testing debug.".to_string()),
            ShimEvent::RadiologyEventShelfLoaded(
                "TestCanvasID".to_string(),
                "TestShelfID".to_string(),
            )
        ]
        );
    }
}
