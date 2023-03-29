use reqwest::Error;

pub async fn make_post_request() -> Result<(), Error> {
    let client = reqwest::Client::new();
    let url = "https://jsonplaceholder.typicode.com/posts";

    let post_data = serde_json::json!({
        "title": "foo",
        "body": "bar",
        "userId": 1,
    });

    let response = client.post(url).json(&post_data).send().await?;

    println!("Response status: {:?}", response.status());
    println!("Response body:\n{}", response.text().await?);

    Ok(())
}
