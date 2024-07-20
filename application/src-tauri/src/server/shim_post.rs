pub(crate) async fn handle(
    command: crate::Command,
    other: String,
) -> Result<impl warp::Reply, warp::Rejection> {
    let reply: String = format!("Received: {:?}", command);
    Ok(warp::reply::json(&reply))
}
