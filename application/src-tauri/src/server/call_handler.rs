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
pub struct EventHandler {}

impl Service<Request<Incoming>> for EventHandler {
    type Response = Response<Full<Bytes>>;
    type Error = hyper::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn call(&self, request: Request<Incoming>) -> Self::Future {
        let result = Self::handle_poll(self.clone(), request);
        Box::pin(result)
    }
}

impl EventHandler {
    pub fn new() -> EventHandler {
        EventHandler {}
    }

    async fn handle_poll(
        self: EventHandler,
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
            match self.process_event(event) {
                Ok(_) => (),
                Err(e) => {
                    eprintln!("Error processing event.{:?}, {:?}", e, as_string)
                }
            }
        }

        return Ok(Response::new(Full::new(Bytes::from("Ok"))));
    }

    fn process_event(&self, event: ShimEvent) -> Result<(), String> {
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
}
