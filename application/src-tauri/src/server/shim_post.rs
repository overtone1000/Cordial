use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub(crate) enum CommandType {
    Debug,
    Heartbeat
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub(crate) struct ShimCommand {
    command: CommandType,
}

/*
pub(crate) fn map_command(
    command: ShimCommand,
) -> impl Filter<Extract = (ShimCommand,), Error = Infallible> + Clone {
    warp::any().map(move || command.clone())
}
    */

    #[derive(Debug)]
struct InvalidJSON;
impl warp::reject::Reject for InvalidJSON{}

pub(crate) async fn handle(
    body: String,
) -> Result<impl warp::Reply, warp::Rejection> {
    println!("Received: {:?}", body);
    let command:ShimCommand=match serde_json::from_str(&body)
    {
        Ok(command)=>command,
        Err(_)=>{
            return Err(warp::reject::custom(InvalidJSON));
        }
    };
    println!("Deserialized: {:?}", command);

    let reply: String = format!("Ok");
    Ok(warp::reply::json(&reply))
}
