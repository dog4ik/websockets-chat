use axum::{
    extract::{ws::WebSocketUpgrade, Query},
    response::Response,
    routing::get,
    Extension, Router,
};
use serde::Deserialize;
use server::{handle_socket, AssignmentsType, ClientsType, ServerState};
use tower_http::cors::{Any, CorsLayer};

#[derive(Deserialize, Clone)]
struct Credential {
    id: Option<String>,
    is_support: Option<bool>,
}

#[tokio::main]
async fn main() {
    let state = ServerState::new();
    let app = Router::new()
        .route("/ws", get(handler))
        .route("/clients", get(ServerState::get_clients))
        .route("/supporters", get(ServerState::get_supporters))
        .route("/getall", get(ServerState::get_all_connections))
        .route("/getmyclients", get(ServerState::get_clients_for_id))
        .layer(Extension(state.clients))
        .layer(Extension(state.assignments))
        .layer(CorsLayer::new().allow_origin(Any));

    async fn handler(
        ws: WebSocketUpgrade,
        query: Query<Credential>,
        Extension(state): Extension<ClientsType>,
        Extension(assignments): Extension<AssignmentsType>,
    ) -> Response {
        let id = query.id.clone();
        let is_support = query.is_support.clone();
        ws.on_upgrade(move |socket| handle_socket(socket, state, assignments, id, is_support))
    }

    let _ = axum::Server::bind(&"127.0.0.1:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await;
}
