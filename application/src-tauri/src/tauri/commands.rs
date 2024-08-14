use serde::Deserialize;

use crate::server::event_handler::CallHandler;

#[derive(Deserialize, Debug)]
pub enum Interaction {
    Debug(String),
}

#[tauri::command]
pub async fn tauri_ui_interaction(
    interaction: Interaction,
    call_handler: ::tauri::State<'_, CallHandler>,
) -> Result<(), String> {
    println!("Interaction:{:?}", interaction);
    match interaction {
        Interaction::Debug(message) => {
            println!("Debug: {}", message);
        }
    };

    Ok(())
}
