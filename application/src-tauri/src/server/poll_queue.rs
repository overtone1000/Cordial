use http_body_util::{BodyExt, Full};
use hyper::{
    body::{self, Bytes, Incoming},
    service::Service,
    Request, Response,
};

use crate::shim_api::{
    shim_events::{ShimEvent, ShimEventPackage},
    shim_interface::ShimFunction,
};
use std::{
    collections::VecDeque,
    future::Future,
    pin::Pin,
    sync::{Arc, Mutex},
    time::Instant,
};

#[derive(Clone)]
pub struct PollQueue {
    waiter: Arc<Mutex<Option<Instant>>>,
    tasks: Arc<Mutex<VecDeque<ShimFunction>>>,
}

impl Service<Request<Incoming>> for PollQueue {
    type Response = Response<Full<Bytes>>;
    type Error = hyper::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn call(&self, request: Request<Incoming>) -> Self::Future {
        let result = Self::handle_call(self.clone(), request);
        Box::pin(result)
    }
}

impl PollQueue {
    async fn handle_call(
        self: PollQueue,
        request: Request<Incoming>,
    ) -> Result<Response<Full<Bytes>>, hyper::Error> {
        let method = request.method().clone();
        let path = request.uri().path().to_string();
        let headers = request.headers().clone();

        let as_string = String::from_utf8(request.collect().await?.to_bytes().to_vec())
            .expect("Couldn't parse bytes.");

        println!(
            "Received: {}, {}, {:?}, {}",
            method, path, headers, as_string
        );

        let events: ShimEventPackage = match serde_json::from_str(&as_string) {
            Ok(event) => event,
            Err(e) => {
                return Ok(Response::new(Full::new(Bytes::from("Invalid JSON"))));
            }
        };

        println!("Deserialized: {:?}", events);
        for event in events {
            self.process_event(event);
        }

        self.get_poll_response()
    }

    pub fn new() -> PollQueue {
        PollQueue {
            waiter: Arc::new(Mutex::new(None)),
            tasks: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    fn process_event(&self, event: ShimEvent) {
        println!("Processing event {:?}", event);
        match event {
            ShimEvent::Poll => println!("Shim heartbeat"),
            ShimEvent::Debug(message) => println!("Debug message from shim: {}", message),
            ShimEvent::RadiologyEventShelfLoaded(canvas_page_id, shelf_id) => {
                println!("Shelf loaded:{} {}", canvas_page_id, shelf_id)
            }
        };
    }

    fn get_poll_response(&self) -> Result<Response<Full<Bytes>>, hyper::Error> {
        let dt = std::time::Instant::now();
        println!("Processing poll response at {:?}", dt);

        let mut debug_out_waiting = false;
        loop {
            //Fetch the tasks that need to be sent in the response
            let tasks = match self.tasks.lock() {
                Ok(tasks) => tasks,
                Err(e) => {
                    eprintln!("Couldn't lock tasks. {}", e);
                    return Ok(Response::new(Full::new(Bytes::from("Broken Poll Queue"))));
                }
            };

            if !tasks.is_empty() {
                //If there are tasks, send them in the return
                let reply: String = format!("Here are some tasks from {:?}", dt);
                eprintln!("NOT IMPLEMENTED YET");
                return Ok(Response::new(Full::new(Bytes::from("Didn't handle tasks"))));
            } else {
                //Otherwise, determine wait for tasks until a newer poll comes along.
                let mut waiter = match self.waiter.lock() {
                    Ok(waiter) => waiter,
                    Err(e) => {
                        eprintln!("Couldn't lock mutex! {}", e);
                        return Ok(Response::new(Full::new(Bytes::from("Broken Poll Queue"))));
                    }
                };

                let this_thread_is_the_waiter: bool = match waiter.as_mut() {
                    Some(waiter) => *waiter <= dt,
                    None => true,
                };

                if this_thread_is_the_waiter {
                    *waiter = Some(dt);
                    if !debug_out_waiting {
                        println!("This thread is the waiter. {:?}", dt);
                        debug_out_waiting = true;
                    }
                } else {
                    let reply: String = format!("{:?} won't wait anymore.", dt);
                    eprintln!("NOT IMPLEMENTED YET");
                    return Ok(Response::new(Full::new(Bytes::from("Quit waiting"))));
                }
            }
        }
    }

    pub(crate) async fn handle_poll(
        queue_arc: Arc<PollQueue>,
        request: Request<hyper::body::Incoming>,
    ) -> Result<Response<Full<Bytes>>, hyper::Error> {
        let method = request.method().clone();
        let path = request.uri().path().to_string();
        let headers = request.headers().clone();
        let as_string = String::from_utf8(request.collect().await?.to_bytes().to_vec())
            .expect("Couldn't parse bytes.");

        println!(
            "Received: {}, {}, {:?}, {}",
            method, path, headers, as_string
        );

        let events: ShimEventPackage = match serde_json::from_str(&as_string) {
            Ok(event) => event,
            Err(e) => {
                return Ok(Response::new(Full::new(Bytes::from("Invalid JSON"))));
            }
        };

        println!("Deserialized: {:?}", events);
        for event in events {
            queue_arc.process_event(event);
        }

        queue_arc.get_poll_response()
    }
}
