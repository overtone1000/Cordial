use http_body_util::{BodyExt, Full};
use hyper::{
    body::{Bytes, Incoming},
    service::Service,
    Request, Response,
};

use crate::shim_api::events::ShimEvent;
use std::{future::Future, pin::Pin};

#[derive(Clone)]
pub struct EventHandler {}

impl Service<Request<Incoming>> for EventHandler {
    type Response = Response<Full<Bytes>>;
    type Error = Box<dyn std::error::Error + Send + Sync>;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn call(&self, request: Request<Incoming>) -> Self::Future {
        println!("Handling event.");
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
    ) -> Result<Response<Full<Bytes>>, Box<dyn std::error::Error + Send + Sync>> {
        let method = request.method().clone();
        let path = request.uri().path().to_string();
        let headers = request.headers().clone();

        let as_string = String::from_utf8(request.collect().await?.to_bytes().to_vec())
            .expect("Couldn't parse bytes.");

        println!(
            "Received event: {}, {}, {:?}, {}",
            method, path, headers, as_string
        );

        match serde_json::from_str(&as_string) {
            Ok(event) => match self.process_event(event) {
                Ok(_) => (),
                Err(e) => {
                    eprintln!("Error processing event.{:?}, {:?}", e, as_string)
                }
            },
            Err(_e) => {
                eprintln!("Error getting event from string. {:?}", &as_string);
                return Ok(Response::new(Full::new(Bytes::from("Invalid JSON"))));
            }
        };

        return Ok(Response::new(Full::new(Bytes::from("Ok"))));
    }

    fn process_event(&self, event: ShimEvent) -> Result<(), String> {
        println!("Processing event {:?}", event);
        match event {
            ShimEvent::Debug(message) => println!("Debug message from shim: {}", message),
            ShimEvent::PageStatus(canvas_page_id, shelf_id, visible) => {
                println!("Shelf loaded:{} {} {}", canvas_page_id, shelf_id, visible)
            }
            ShimEvent::QueryResult(result) => {
                println!("Query result::{:?}", result);
            }
            ShimEvent::Logout => {
                println!("Logout.");
            }
        };

        Ok(())
    }
}
