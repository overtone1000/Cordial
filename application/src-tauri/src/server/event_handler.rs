use crate::shim_api::events::ShimEvent;
use http_body_util::{BodyExt, Full};
use hyper::{
    body::{Bytes, Incoming},
    service::Service,
    Request, Response,
};
use hyper_trm::{
    commons::{full_to_boxed_body, HandlerError, HandlerFuture, HandlerResponse, HandlerResult},
    service::stateless_service::StatelessHandler,
};
use std::{future::Future, pin::Pin};

#[derive(Clone)]
pub struct EventHandler {}

impl StatelessHandler for EventHandler {
    async fn handle_request(request: Request<Incoming>) -> HandlerResult {
        let method = request.method().clone();
        let path = request.uri().path().to_string();
        let headers = request.headers().clone();

        let as_string = String::from_utf8(request.collect().await?.to_bytes().to_vec())
            .expect("Couldn't parse bytes.");

        match serde_json::from_str(&as_string) {
            Ok(event) => match Self::process_event(event) {
                Ok(_) => (),
                Err(e) => {
                    eprintln!("Error processing event.{:?}, {:?}", e, as_string)
                }
            },
            Err(_e) => {
                println!(
                    "Received event: {}, {}, {:?}, {}",
                    method, path, headers, as_string
                );
                eprintln!("Error getting event from string. {:?}", &as_string);
                return Ok(Response::new(full_to_boxed_body("Invalid JSON")));
            }
        };

        return Ok(Response::new(full_to_boxed_body("Ok")));
    }
}

impl EventHandler {
    pub fn new() -> EventHandler {
        EventHandler {}
    }

    fn process_event(event: ShimEvent) -> Result<(), String> {
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
            _ => {
                eprintln!("Unhandled event: {:?}", event);
            }
        };

        Ok(())
    }
}
