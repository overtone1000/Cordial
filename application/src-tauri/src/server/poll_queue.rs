use crate::shim_api::{shim_events::{ShimEvent, ShimEventPackage}, shim_interface::ShimFunction};
use std::{
    collections::VecDeque, rc::Rc, sync::{Arc, Mutex}, time::Instant
};

#[derive(Debug)]
struct InvalidJSON;
impl warp::reject::Reject for InvalidJSON {}

#[derive(Debug)]
struct BrokenPollQueue;
impl warp::reject::Reject for BrokenPollQueue {}

#[derive(Clone)]
pub struct Waiter {
    origin:Instant
}

#[derive(Clone)]
pub struct PollQueue {
    waiter: Rc<Mutex<Option<Waiter>>>,
    tasks: Rc<Mutex<VecDeque<ShimFunction>>>
}

impl PollQueue {
    pub fn new() -> PollQueue {
        PollQueue { 
            waiter: Rc::new(Mutex::new(None)),
            tasks: Rc::new(Mutex::new(VecDeque::new()))
        }
    }

    fn process_event(&self, event:ShimEvent)
    {
        println!("Processing event {:?}", event);
        match event {
            ShimEvent::Poll => println!("Shim heartbeat"),
            ShimEvent::Debug(message) => println!("Debug message from shim: {}", message),
            ShimEvent::RadiologyEventShelfLoaded(canvas_page_id, shelf_id) => {
                println!("Shelf loaded:{} {}", canvas_page_id, shelf_id)
            }
        };
    }

    fn get_poll_response(&self) -> Result<impl warp::Reply, warp::Rejection> 
    {
        let dt = std::time::Instant::now();
        loop {
            let tasks=match self.tasks.lock()
            {
                Ok(tasks) => tasks,
                Err(e) => {
                    eprintln!("Couldn't lock tasks. {}",e);
                    return Err(warp::reject::custom(BrokenPollQueue));
                },
            };
            if !tasks.is_empty()
            {
                let reply: String = format!("Ok");
                return Ok(warp::reply::json(&reply));
            }
            else {
                let mut waiter = match self.waiter.lock() {
                    Ok(waiter) => waiter,
                    Err(e) => {
                        eprintln!("Couldn't lock mutex! {}", e);
                        return Err(warp::reject::custom(BrokenPollQueue));
                    }
                };

                match waiter
                {
                    Some(waiter) => todo!(),
                    None => todo!(),
                };
            }
        }
    }

    pub(crate) async fn handle_poll(
        queue_arc: Arc<PollQueue>,
        body: String,
    ) -> Result<impl warp::Reply, warp::Rejection> {

        println!("Received: {:?}", body);
        let events: ShimEventPackage = match serde_json::from_str(&body) {
            Ok(event) => event,
            Err(_) => {
                return Err(warp::reject::custom(InvalidJSON));
            }
        };

        println!("Deserialized: {:?}", events);
        for event in events
        {
            queue_arc.process_event(event);
        }

        queue_arc.get_poll_response()
    }
}
