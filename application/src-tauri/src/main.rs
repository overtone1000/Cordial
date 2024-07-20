// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tokio::main]
async fn main() {
    println!("Starting Cordial");
    println!("Starting Cordial Server");
    let server = app::tokio_serve();
    println!("Creating Cordial Window");
    std::future::join!(server, app::tauri_start());
    app::tauri_start();
    println!("Server Await");
    server.await;
    println!("Closing Cordial");
}
