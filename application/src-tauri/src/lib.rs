use std::{
    net::{IpAddr, Ipv4Addr, SocketAddr},
    sync::Arc,
};

use hyper::{server::conn::http1, service::service_fn, Request};
use hyper_util::rt::{TokioIo, TokioTimer};
use server::poll_queue::PollQueue;
use tokio::net::TcpListener;

const SHIM_ADDRESS: u16 = 43528;

pub mod server;
pub mod shim_api;

pub async fn tokio_serve<'a>() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("Building server");

    let pollqueue = PollQueue::new();

    //address is "shim"

    let socket = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), SHIM_ADDRESS);

    let listener = TcpListener::bind(socket).await?;

    loop {
        let (tcp, _) = listener.accept().await?;

        let io = TokioIo::new(tcp);
        let clone = pollqueue.clone();

        tokio::task::spawn(async move {
            // Handle the connection from the client using HTTP1 and pass any
            // HTTP requests received on that connection to the `hello` function
            if let Err(err) = http1::Builder::new()
                .timer(TokioTimer::new())
                .serve_connection(io, clone)
                .await
            {
                println!("Error serving connection: {:?}", err);
            }
        });
    }
}

pub fn tauri_start() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Tauri start error");
}
