// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app::server::event_handler::EventHandler;

#[tokio::main]
async fn main() {
    println!("Starting Cordial");

    tauri::async_runtime::set(tokio::runtime::Handle::current()); //Manually manage the tokio asynchronous runtime

    let event_handler = EventHandler::new();

    {
        println!("Spawning server");
        tokio::spawn(app::tokio_serve(event_handler.clone()));

        println!("Creating interface");
        app::tauri_start(event_handler.clone());
    }

    println!("Closing Cordial");
}
