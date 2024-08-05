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
pub struct PollHandler {
    tasks: Arc<Mutex<VecDeque<ShimFunction>>>,
}

impl Service<Request<Incoming>> for PollHandler {
    type Response = Response<Full<Bytes>>;
    type Error = hyper::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn call(&self, request: Request<Incoming>) -> Self::Future {
        let result = Self::handle_event(self.clone(), request);
        Box::pin(result)
    }
}

impl PollHandler {

    async fn handle_event(
        self: PollHandler,
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

        self.handle_call_poll()
    }

    pub fn new() -> PollHandler {
        PollHandler {
            tasks: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    fn process_event(&self, event: ShimEvent) -> Result<(),String> {
        println!("Processing event {:?}", event);
        match event {
            ShimEvent::Poll => println!("Shim heartbeat"),
            ShimEvent::Debug(message) => println!("Debug message from shim: {}", message),
            ShimEvent::RadiologyEventShelfLoaded(canvas_page_id, shelf_id) => {
                println!("Shelf loaded:{} {}", canvas_page_id, shelf_id)
            }
        };

        Ok(())
    }

    fn handle_call_poll(&self) -> Result<Response<Full<Bytes>>, hyper::Error> {

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
                eprintln!("NOT IMPLEMENTED YET");
                return Ok(Response::new(Full::new(Bytes::from("Didn't handle tasks"))));
            }
            else
            {
                eprintln!("Need to wait here");
            }
        }
    }

    pub(crate) async fn handle_event_poll(
        queue_arc: Arc<PollHandler>,
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
            match queue_arc.process_event(event)
            {
                Ok(_)=>(),
                Err(e)=>{eprintln!("Need to handle the rest of the events but notify user of error state");}
            }
        }

        return Ok(Response::new(Full::new(Bytes::from("Ok"))));
    }
}
