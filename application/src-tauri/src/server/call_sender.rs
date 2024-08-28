use http_body_util::{BodyExt, Full};
use hyper::{
    body::{Bytes, Incoming},
    service::Service,
    Request, Response,
};

use std::{
    collections::VecDeque,
    future::Future,
    pin::Pin,
    sync::{Arc, Mutex},
};

use crate::shim_api::calls::ShimCall;

#[derive(Clone)]
pub struct CallSender {
    tasks: Arc<Mutex<VecDeque<ShimCall>>>,
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
        
        println!("Received poll request.");

        let method = request.method().clone();
        let path = request.uri().path().to_string();
        let headers = request.headers().clone();

        let as_string = String::from_utf8(request.collect().await?.to_bytes().to_vec())
            .expect("Couldn't parse bytes.");

        /*
        println!(
            "Received request on poll server loop: {}, {}, {:?}, {}",
            method, path, headers, as_string
        );
        */
        
        loop {
            //Put this in its own block so self.tasks mutex gets released before yielding
            {
                //println!("Poll handling loop.");
                
                //Fetch the tasks that need to be sent in the response
                match self.tasks.lock() {
                    Ok(mut tasks) => {
                        if !tasks.is_empty() {
                            //If there are tasks, send them in the return
                            let iter = tasks.iter();
                            let collected:Vec<&ShimCall> = iter.collect();
                            //println!("Tasks discovered and collected: {:?}",collected);
                            let as_str=serde_json::to_string(&collected);
                            tasks.clear();
        
                            match as_str
                            {
                                Ok(as_str)=>{
                                    //println!("Sending to shim {:?}",as_str);
                                    return Ok(Response::new(Full::new(Bytes::from(as_str))));
                                },
                                Err(e)=>{
                                    eprintln!("Couldn't serialize requests. {:?}",e);
                                }
                            }
                        }
                    },
                    Err(e) => {
                        eprintln!("Couldn't lock tasks. {}", e);
                        return Ok(Response::new(Full::new(Bytes::from("Broken Poll Queue"))));
                    }
                };
            }

            //Now yield
            tokio::task::yield_now().await;
        }
    }

    pub(crate) fn make_call(&self, call:ShimCall)
    {
        match self.tasks.lock()
        {
            Ok(mut tasks) => {
                //println!("Pushing call to stack. {:?}",call);
                //println!("There are currently {} tasks.",tasks.len());
                tasks.push_back(call);
            },
            Err(e) => eprintln!("Couldn't lock tasks.{:?}",e),
        }
    }
}
