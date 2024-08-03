// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app::server::poll_queue::PollQueue;

#[tokio::main]
async fn main() {
    println!("Starting Cordial");

    tauri::async_runtime::set(tokio::runtime::Handle::current()); //Manually manage the tokio asynchronous runtime

    {
        println!("Spawning server");
        tokio::spawn(app::tokio_serve());

        println!("Creating interface");
        app::tauri_start();
    }

    println!("Closing Cordial");
}
