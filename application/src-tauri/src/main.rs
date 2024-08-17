// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app::server::call_sender::CallSender;

#[tokio::main]
async fn main() {
    println!("Starting Cordial");

    tauri::async_runtime::set(tokio::runtime::Handle::current()); //Manually manage the tokio asynchronous runtime

    let call_sender = CallSender::new();

    {
        println!("Spawning server");
        tokio::spawn(app::tokio_serve(call_sender.clone()));

        println!("Creating interface");
        app::tauri_start(call_sender.clone());
    }

    println!("Closing Cordial");
}
