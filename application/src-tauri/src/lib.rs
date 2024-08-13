use std::{
    error::Error,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    sync::Arc,
};

use hyper::{
    body::{Body, Incoming},
    server::conn::http1,
    service::{service_fn, HttpService, Service},
    Request,
};
use hyper_util::rt::{TokioIo, TokioTimer};
use server::poll_handler::PollHandler;
use tokio::net::TcpListener;

use serde::ser::StdError;

const SHIM_EVENT_PORT: u16 = 43528;
const SHIM_CALL_PORT: u16 = 43529;

pub mod server;
pub mod shim_api;

pub async fn tokio_serve<'a>() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("Building server");

    let pollqueue = PollHandler::new();

    let call_server = create_server(IpAddr::V4(Ipv4Addr::LOCALHOST), SHIM_EVENT_PORT, &pollqueue);
    let event_server = create_server(IpAddr::V4(Ipv4Addr::LOCALHOST), SHIM_CALL_PORT, &pollqueue);

    call_server.await?;
    event_server.await?;

    Ok(())
}

async fn create_server<S>(
    ip: IpAddr,
    port: u16,
    service: S,
) -> Result<TcpListener, Box<dyn std::error::Error + Send + Sync>>
where
    S: HttpService<Incoming>,
    S::Error: Into<Box<dyn StdError + Send + Sync>>,
    S::ResBody: 'static,
    <S::ResBody as Body>::Error: Into<Box<dyn StdError + Send + Sync>>,
{
    let socket = SocketAddr::new(ip, port);
    let listener = TcpListener::bind(socket).await?;

    loop {
        let (event_tcp_stream, _) = listener.accept().await?;

        //Need to spawn these as separate tasks...
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
