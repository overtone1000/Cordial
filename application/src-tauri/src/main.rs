// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app::server::event_handler::CallHandler;

#[tokio::main]
async fn main() {
    println!("Starting Cordial");

    tauri::async_runtime::set(tokio::runtime::Handle::current()); //Manually manage the tokio asynchronous runtime

    let call_handler = CallHandler::new();

    {
        println!("Spawning server");
        tokio::spawn(app::tokio_serve(call_handler.clone()));

        println!("Creating interface");
        app::tauri_start(call_handler.clone());
    }

    println!("Closing Cordial");
}
