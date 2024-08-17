use serde::Deserialize;

use crate::{server::call_sender::CallSender, shim_api::{calls::ShimCall, query::ShimQuery}};

#[derive(Deserialize, Debug)]
pub enum Interaction {
    Debug(String),
    Test(i64)
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
        },
        Interaction::Test(index)=>{
            match index
            {
                0=>{
                    call_sender.make_call(
                        ShimCall::Query(
                            ShimQuery::by_mrn_and_accession(
                                "MRN goes here",
                                "Accession goes here"
                            )
                        )
                    )
                },
                _=>{eprintln!("Invalid test index.");}
            }
        },
    };

    Ok(())
}
