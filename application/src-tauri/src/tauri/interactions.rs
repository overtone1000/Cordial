use serde::Deserialize;

use crate::server::call_sender::CallSender;

#[derive(Deserialize, Debug)]
pub enum Interaction {
    Debug(String),
}

#[tauri::command]
pub async fn tauri_ui_interaction(
    interaction: Interaction,
    call_sender: ::tauri::State<'_, CallSender>,
) -> Result<(), String> {
    println!("Interaction:{:?}", interaction);
    match interaction {
        Interaction::Debug(message) => {
            println!("Debug: {}", message);
        }
    };

    Ok(())
}
