use crate::ws::ServerMessage;
use axum::{extract::ws::Message, Extension};
use serde::Serialize;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::{broadcast, mpsc::Sender, Mutex};

#[derive(Debug, Clone)]
pub struct Client {
    pub sender: Option<Sender<ServerMessage>>,
    pub daddy: Option<String>,
}

pub type ClientsType = Arc<Mutex<HashMap<String, Client>>>;
pub type AssignmentsType = Arc<Mutex<HashMap<String, Vec<String>>>>;
pub type SenderType = Arc<Mutex<broadcast::Sender<(Message, usize)>>>;

#[derive(Debug)]
pub struct ServerState {
    pub sender: SenderType,
    pub clients: ClientsType,
    pub assignments: AssignmentsType,
}

#[derive(Debug, Serialize)]
pub struct RegisterResponse {
    pub id: String,
    pub support_id: String,
}

async fn get_help(state: AssignmentsType, my_id: String) -> Option<String> {
    match state
        .lock()
        .await
        .iter_mut()
        .min_by_key(|(_, val)| val.len())
    {
        Some((id, clients)) => {
            clients.push(my_id);
            Some(id.clone())
        }
        None => None,
    }
}

//NOTE: try standard mutex
impl ServerState {
    pub fn new() -> ServerState {
        let (sender, _) = broadcast::channel(100);
        let sender = Arc::new(Mutex::new(sender));
        let clients = Arc::new(Mutex::new(HashMap::new()));
        let assignments = Arc::new(Mutex::new(HashMap::new()));
        ServerState {
            sender,
            clients,
            assignments,
        }
    }
    pub async fn get_clients(
        Extension(state): Extension<ClientsType>,
        Extension(assignments): Extension<AssignmentsType>,
    ) -> String {
        let clients = state.lock().await;
        let assignments = assignments.lock().await;
        let clients: Vec<(&String, bool)> = clients
            .iter()
            .filter(|(id, _)| !assignments.contains_key(id.as_str()))
            .map(|(key, val)| {
                (
                    key,
                    match val.sender {
                        Some(_) => true,
                        None => false,
                    },
                )
            })
            .collect();
        serde_json::to_string(&clients).unwrap()
    }

    pub async fn get_supporters(Extension(assignments): Extension<AssignmentsType>) -> String {
        serde_json::to_string(&assignments.lock().await.iter().collect::<Vec<_>>()).unwrap()
    }

    pub async fn register_client(
        Extension(clients): Extension<ClientsType>,
        Extension(state): Extension<AssignmentsType>,
    ) -> String {
        let uuid = uuid::Uuid::new_v4().to_string();
        let mut clients = clients.lock().await;
        //TODO: Error it
        let support_id = match get_help(state, uuid.to_string()).await {
            Some(id) => {
                let sender = clients.get_mut(&id).unwrap();
                sender
                    .sender
                    .clone()
                    .unwrap()
                    .send(ServerMessage::Update)
                    .await
                    .unwrap();
                id
            }
            None => unimplemented!(),
        };
        clients.insert(
            uuid.to_string(),
            Client {
                sender: None,
                daddy: Some(support_id.clone()),
            },
        );
        println!("registered client with id {}", uuid.to_string());
        serde_json::to_string(&RegisterResponse {
            id: uuid.to_string(),
            support_id,
        })
        .unwrap()
    }

    pub async fn register_support(
        Extension(clients): Extension<ClientsType>,
        Extension(assignments): Extension<AssignmentsType>,
    ) -> String {
        let uuid = uuid::Uuid::new_v4().to_string();
        let mut assginments = assignments.lock().await;
        let mut clients = clients.lock().await;
        clients.insert(
            uuid.to_string(),
            Client {
                sender: None,
                daddy: None,
            },
        );
        assginments.insert(uuid.to_string(), vec![]);
        println!("registered support with id {}", uuid.to_string());
        uuid.to_string()
    }
}
