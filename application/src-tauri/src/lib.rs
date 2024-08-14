use std::{
    error::Error,
    future::Future,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    pin::Pin,
    sync::Arc,
};

use http_body_util::Full;
use hyper::{
    body::{Body, Bytes, Incoming},
    server::conn::http1,
    service::{service_fn, HttpService, Service},
    Request, Response,
};
use hyper_util::rt::{TokioIo, TokioTimer};
use serde::ser::StdError;
use server::{call_handler::EventHandler, commons::spawn_server, event_handler::CallHandler};
use tokio::net::TcpListener;

const SHIM_EVENT_PORT: u16 = 43528;
const SHIM_CALL_PORT: u16 = 43529;

pub mod server;
pub mod shim_api;

pub async fn tokio_serve<'a>() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("Building server");

    let event_handler = EventHandler::new();
    let event_server = spawn_server(
        IpAddr::V4(Ipv4Addr::LOCALHOST),
        SHIM_EVENT_PORT,
        &event_handler,
    );

    let call_handler = CallHandler::new();
    let call_server = spawn_server(
        IpAddr::V4(Ipv4Addr::LOCALHOST),
        SHIM_CALL_PORT,
        &call_handler,
    );

    tokio::try_join!(event_server, call_server)?;

    Ok(())
}

pub fn tauri_start() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Tauri start error");
}
