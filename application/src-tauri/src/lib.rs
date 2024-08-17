use server::{call_sender::CallSender, commons::spawn_server, event_handler::EventHandler};
use std::net::{IpAddr, Ipv4Addr};

const SHIM_EVENT_PORT: u16 = 43528;
const SHIM_CALL_PORT: u16 = 43529;

pub mod server;
pub mod shim_api;
pub mod tauri;

pub async fn tokio_serve<'a>(
    call_handler: CallSender,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("Building server");

    let event_handler = EventHandler::new();
    let event_server = spawn_server(
        IpAddr::V4(Ipv4Addr::LOCALHOST),
        SHIM_EVENT_PORT,
        &event_handler,
    );

    let call_server = spawn_server(
        IpAddr::V4(Ipv4Addr::LOCALHOST),
        SHIM_CALL_PORT,
        &call_handler,
    );

    tokio::try_join!(event_server, call_server)?;

    Ok(())
}

pub fn tauri_start(event_handler: CallSender) {
    println!("Starting Tauri Interface");
    ::tauri::Builder::default()
        .manage(event_handler)
        .invoke_handler(::tauri::generate_handler![
            crate::tauri::interactions::tauri_ui_interaction
        ])
        .run(::tauri::generate_context!())
        .expect("Tauri start error");
}
