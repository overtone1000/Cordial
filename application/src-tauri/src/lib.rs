use std::{
    net::{IpAddr, Ipv4Addr, SocketAddr},
    sync::{Arc, Mutex},
};

use server::poll_queue::PollQueue;
use warp::Filter;

const SHIM_ADDRESS: u16 = 43528;

pub mod server;
pub mod shim_api;

pub async fn tokio_serve<'a>(poll_queue_arc: Arc<PollQueue>) {
    // GET /hello/warp => 200 OK with body "Hello, warp!"
    println!("Building server");

    let hello_handler = |name| {
        println!("Responding...");
        format!("Hello, {}!", name)
    };

    let pollclone = Arc::new(Mutex::new(PollQueue::new()));
    let shim_event_handler = move |body: String| PollQueue::handle(pollclone.clone(), body);

    let shim_route = warp::post()
        .and(warp::path("shim"))
        .and(warp::path::end())
        .and(warp::body::json())
        //.and(server::shim_post::map_command(command.clone())) //This is terrible! Parse it yourself.
        .and_then(shim_event_handler);

    let hello_route = warp::path!("hello" / String).map(hello_handler);

    let routes = shim_route.or(hello_route);

    let socket = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), SHIM_ADDRESS);

    println!("Starting server");
    warp::serve(routes).run(socket).await;
}

pub fn tauri_start() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Tauri start error");
}
