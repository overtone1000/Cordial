use std::net::{IpAddr, Ipv4Addr, SocketAddr};

use warp::Filter;

const SHIM_ADDRESS:u16=43528;

pub async fn tokio_serve() {
    // GET /hello/warp => 200 OK with body "Hello, warp!"
    println!("Starting server.");

    let hello = warp::path!("hello" / String)
    .map(|name| {
        println!("Responding...");
        format!("Hello, {}!", name)
    });

    let socket = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), SHIM_ADDRESS);

    warp::serve(hello)
        .run(socket)
        .await;
}

pub fn tauri_start() {
    tauri::Builder::default()
          .run(tauri::generate_context!())
          .expect("error while running tauri application");
}