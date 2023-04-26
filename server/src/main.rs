use axum::{
    extract::{ws::WebSocketUpgrade, Query},
    response::Response,
    routing::{get, post},
    Extension, Router,
};
use reqwest::StatusCode;
use serde::Deserialize;
use server::{
    handle_socket,
    state::{IdQuery, MessagesStore},
    Assignments, Clients, Image, ServerState,
};
use tower_http::cors::{Any, CorsLayer};

#[derive(Deserialize, Clone)]
struct Credential {
    id: Option<String>,
    is_support: Option<bool>,
}

#[tokio::main]
async fn main() {
    let assignments = Assignments::new();
    let clients = Clients::new();
    let store = MessagesStore::new();
    let app = Router::new()
        .route("/ws", get(handler))
        .route("/clients", get(ServerState::get_clients))
        .route("/supporters", get(ServerState::get_supporters))
        .route("/getall", get(|Extension(clients):Extension<Clients>|async move{ServerState::get_all_connections( Extension(clients.clients)).await}))
        .route("/getmyclients", get(ServerState::get_clients_for_id))
        .route(
            "/getidsmsg",
            get(
                |Extension(store): Extension<MessagesStore>, Query(query): Query<IdQuery>| async move {
                    match store.get(&query.id).await {
                        Some(msg) => serde_json::to_string(&msg).map_err(|_| StatusCode::BAD_REQUEST),
                        None => Err(StatusCode::NOT_FOUND),
                    }
                },
                ),
                )
        // for debug
        .route("/getorphans", get(|Extension(assignments):Extension<Assignments>|async move {
            ServerState::get_orphans(Extension(assignments.wait_list)).await
        }))
    .route(
        "/getmsgs",
        get(|Extension(store): Extension<MessagesStore>| async move { store.get_all().await }),
        )
        .route("/img",post(|Extension(msg_store): Extension<MessagesStore>,Query(query): Query<IdQuery>,body: axum::body::Bytes|async move {
            let id = query.id;
            let _store = msg_store.get(&id).await.unwrap();
            let image = Image::new(body);
            match image {
                Ok(_) => {
                    println!("valid image provided");
                    Ok(serde_json::to_string(&true).unwrap())
                },
                Err(_) => {
                    Err(StatusCode::BAD_REQUEST)
                }
            }
        }))
    .layer(Extension(clients))
        .layer(Extension(assignments))
        .layer(Extension(store))
        .layer(CorsLayer::new().allow_origin(Any));

    async fn handler(
        ws: WebSocketUpgrade,
        query: Query<Credential>,
        Extension(clients): Extension<Clients>,
        Extension(store): Extension<MessagesStore>,
        Extension(assignments): Extension<Assignments>,
    ) -> Response {
        let id = query.id.clone();
        let is_support = query.is_support;
        ws.on_upgrade(move |socket| {
            handle_socket(socket, clients, assignments, store, id, is_support)
        })
    }

    let _ = axum::Server::bind(&"127.0.0.1:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await;
}
