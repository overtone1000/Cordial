use http_body_util::{BodyExt, Full};
use hyper::{
    body::{Bytes, Incoming},
    service::Service,
    Request, Response,
};
use tokio::time::Instant;
use tokio::time::Duration;

use std::{
    collections::VecDeque,
    future::Future,
    pin::Pin,
    sync::{Arc, Mutex},
};

use crate::shim_api::calls::ShimCall;

const HANDSHAKE_INTERVAL: std::option::Option<Duration> = Some(Duration::new(4,0));

#[derive(Clone)]
pub struct CallSender {
    tasks: Arc<Mutex<VecDeque<ShimCall>>>,
}

impl Service<Request<Incoming>> for CallSender {
    type Response = Response<Full<Bytes>>;
    type Error = Box<dyn std::error::Error + Send + Sync>;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn call(&self, request: Request<Incoming>) -> Self::Future {
        println!("Handling poll.");
        let result = Self::handle_poll(self.clone(), request);
        Box::pin(result)
    }
}

impl CallSender {
    pub fn new() -> CallSender {
        CallSender {
            tasks: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    async fn handle_poll(
        self: CallSender,
        _request: Request<Incoming>,
    ) -> Result<Response<Full<Bytes>>, Box<dyn std::error::Error + Send + Sync>> {
        println!("Received poll request.");

        /*
        let method = request.method().clone();
        let uri = request.uri().to_string();
        let path = request.uri().path().to_string();
        let headers = request.headers().clone();

        let as_string = String::from_utf8(request.collect().await?.to_bytes().to_vec())
            .expect("Couldn't parse bytes.");
        */

        /*
        println!(
            "Received request on poll server loop: {}, {}, {:?}, {}",
            method, path, headers, as_string
        );
        */

        let response_builder = Response::builder()
            .header(
                "Access-Control-Allow-Headers",
                "Access-Control-Allow-Origin",
            )
            .header("Access-Control-Allow-Origin", "*");

        let start = Instant::now();        

        loop {
            //Put this in its own block so self.tasks mutex gets released before yielding
            //Fetch the tasks that need to be sent in the response
            match self.tasks.lock() {
                Ok(mut tasks) => {

                    //If handshake_interval has passed, add a handshake task
                    if Instant::now().checked_duration_since(start)>HANDSHAKE_INTERVAL
                    {
                        tasks.push_back(
                            ShimCall::Handshake  
                        );
                    }
                    if !tasks.is_empty() {
                        //If there are tasks, send them in the return
                        let iter = tasks.iter();
                        let collected: Vec<&ShimCall> = iter.collect();
                        //println!("Tasks discovered and collected: {:?}",collected);
                        let as_str = serde_json::to_string(&collected);
                        tasks.clear();

                        match as_str {
                            Ok(as_str) => {
                                println!("Sending to shim {:?}", as_str);

                                match response_builder
                                    .status(200)
                                    .header("Content-Type", "application/json")
                                    .body(Full::new(Bytes::from(as_str)))
                                {
                                    Ok(response) => {
                                        return Ok(response);
                                    }
                                    Err(e) => {
                                        return Err(e.into());
                                    }
                                }
                            }
                            Err(e) => {
                                eprintln!("Couldn't serialize requests. {:?}", e);
                            }
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Couldn't lock tasks. {}", e);
                    match response_builder
                        .status(500) //Internal server error
                        .header("Content-Type", "text/plain ")
                        .body(Full::new(Bytes::from("Broken Poll Queue")))
                    {
                        Ok(response) => {
                            return Ok(response);
                        }
                        Err(e) => {
                            return Err(e.into());
                        }
                    };
                }
            };

            //Now yield
            tokio::task::yield_now().await;
        }
    }

    pub(crate) fn make_call(&self, call: ShimCall) {
        match self.tasks.lock() {
            Ok(mut tasks) => {
                //println!("Pushing call to stack. {:?}",call);
                //println!("There are currently {} tasks.",tasks.len());
                tasks.push_back(call);
            }
            Err(e) => eprintln!("Couldn't lock tasks.{:?}", e),
        }
    }
}
