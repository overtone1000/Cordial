use hyper::service::Service;
use serde::Deserialize;

use crate::{server::call_sender::CallSender, shim_api::{calls::ShimCall, query::ShimQuery}};

#[derive(Deserialize, Debug)]
pub enum Interaction {
    Debug(String),
    SpecificQuery(String,String)
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
        Interaction::SpecificQuery(mrn,accession)=>{
            println!("Specific query: mrn: {}, accession: {}",mrn,accession);
            call_sender.make_call(
                ShimCall::Query(
                    ShimQuery::by_mrn_and_accession(mrn.as_str(), accession.as_str())
                )
            )
        }
    };

    Ok(())
}