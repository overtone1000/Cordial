use crate::shim_api::shim_events::ShimEvent;
use std::collections::VecDeque;

#[derive(Debug)]
struct InvalidJSON;
impl warp::reject::Reject for InvalidJSON {}

#[derive(Clone)]
pub struct PollQueue {
    polls: (),
}

impl PollQueue {
    pub fn new() -> PollQueue {
        PollQueue { polls: () }
    }
    pub(crate) async fn handle(&self, body: String) -> Result<impl warp::Reply, warp::Rejection> {
        println!("Received: {:?}", body);
        let event: ShimEvent = match serde_json::from_str(&body) {
            Ok(event) => event,
            Err(_) => {
                return Err(warp::reject::custom(InvalidJSON));
            }
        };

        println!("Deserialized: {:?}", event);
        match event {
            ShimEvent::Heartbeat => println!("Shim heartbeat"),
            ShimEvent::Debug(message) => println!("Debug message from shim: {}", message),
            ShimEvent::RadiologyEventShelfLoaded(canvas_page_id, shelf_id) => {
                println!("Shelf loaded:{} {}", canvas_page_id, shelf_id)
            }
        }

        let reply: String = format!("Ok");
        Ok(warp::reply::json(&reply))
    }
}
