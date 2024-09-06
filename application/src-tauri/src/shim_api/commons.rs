pub type CanvasPageID = String;
pub type ShelfID = String;

pub(crate) fn test_json_serialization<T>(original: T)
where
    T: serde::Serialize + for<'a> serde::Deserialize<'a> + PartialEq + std::fmt::Debug,
{
    let json = serde_json::to_string(&original).expect("Didn't serialize");
    let clone: T = serde_json::from_str(&json).expect("Didn't deserialize");
    println!("{:?} stringified is {}", original, json);
    assert_eq!(original, clone);
}
