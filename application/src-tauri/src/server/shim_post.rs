use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use warp::Filter;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum CommandType {
    Debug,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub(crate) struct ShimCommand {
    command: CommandType,
}

impl ShimCommand {
    pub fn empty() -> ShimCommand {
        ShimCommand {
            command: CommandType::Debug,
        }
    }
}

pub(crate) fn map_command(
    command: ShimCommand,
) -> impl Filter<Extract = (ShimCommand,), Error = Infallible> + Clone {
    warp::any().map(move || command.clone())
}

pub(crate) async fn handle(
    mut something: String,
    command: ShimCommand,
) -> Result<impl warp::Reply, warp::Rejection> {
    let reply: String = format!("Received: {:?}", command);
    Ok(warp::reply::json(&reply))
}
