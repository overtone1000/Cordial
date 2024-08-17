use http_body_util::{BodyExt, Full};
use hyper::{
    body::{Bytes, Incoming},
    service::Service,
    Request, Response,
};

use crate::shim_api::
    shim_interface::ShimFunction
;
use std::{
    collections::VecDeque,
    future::Future,
    pin::Pin,
    sync::{Arc, Mutex},
};

#[derive(Clone)]
pub struct CallSender {
    tasks: Arc<Mutex<VecDeque<ShimFunction>>>,
}

impl Service<Request<Incoming>> for CallSender {
    type Response = Response<Full<Bytes>>;
    type Error = hyper::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn call(&self, request: Request<Incoming>) -> Self::Future {
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

        loop {
            //Put this in its own block so self.tasks mutex gets released before yielding
            {
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
            }

            //Now yield
            tokio::task::yield_now().await;
        }
    }
}
