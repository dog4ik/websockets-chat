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
    id: String,
}

#[tokio::main]
async fn main() {
    let state = ServerState::new();
    let app = Router::new()
        .route("/ws", get(handler))
        .route("/clients", get(ServerState::get_clients))
        .route("/supporters", get(ServerState::get_supporters))
        .route("/register", get(ServerState::register_client))
        .route("/begod", get(ServerState::register_support))
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
        ws.on_upgrade(|socket| handle_socket(socket, state, assignments, id))
    }

    let _ = axum::Server::bind(&"127.0.0.1:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await;
}
