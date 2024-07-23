use crate::shim_api::shim_events::ShimEvent;
use std::{
    borrow::BorrowMut,
    collections::VecDeque,
    ops::DerefMut,
    sync::{Arc, Mutex},
};

#[derive(Debug)]
struct InvalidJSON;
impl warp::reject::Reject for InvalidJSON {}

#[derive(Clone)]
pub struct PollQueue {
    polls: u32,
}

impl PollQueue {
    pub fn new() -> PollQueue {
        PollQueue { polls: 0 }
    }

    pub(crate) fn modify(&mut self) {
        self.polls = self.polls + 1;
    }

    pub(crate) async fn handle(
        queue_arc: Arc<Mutex<PollQueue>>,
        body: String,
    ) -> Result<impl warp::Reply, warp::Rejection> {
        let mut pollqueue = match queue_arc.lock() {
            Ok(pollqueue) => pollqueue,
            Err(e) => {
                panic!("Couldn't lock mutex! {}", e);
            }
        };

        pollqueue.polls = pollqueue.polls + 1;

        println!("Owned queue is now {}", pollqueue.polls);

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
