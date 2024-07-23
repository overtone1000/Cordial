use crate::shim_api::shim_events::ShimEvent;

pub(crate) fn handle(event: ShimEvent) -> Result<impl warp::Reply, warp::Rejection> {
    match event {
        ShimEvent::Heartbeat => println!("Shim heartbeat"),
        ShimEvent::Debug(message) => println!("Debug message from shim: {}", message),
        ShimEvent::RadiologyEventShelfLoaded(canvas_page_id, shelf_id) => {
            println!("Shelf loaded:{} {}", canvas_page_id, shelf_id)
        }
    }

    let reply: String = format!("Ok");
    Ok(warp::reply::json(&reply))
}
