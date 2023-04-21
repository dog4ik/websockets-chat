use crate::ws::ServerMessage;
use axum::{
    extract::{ws::Message, Query},
    Extension,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::{broadcast, mpsc::Sender, Mutex};

#[derive(Debug, Clone)]
pub struct Client {
    pub is_online: bool,
    pub is_support: bool,
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
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageEntry {
    pub id: String,
    pub to: String,
    pub from: String,
    pub msg: MessageType,
    pub date: String,
}

impl MessageEntry {
    pub fn new(from: String, to: String, msg: MessageType) -> MessageEntry {
        let uuid = uuid::Uuid::new_v4().to_string();
        //TODO: Dates
        let date = "fake date".to_string();
        MessageEntry {
            date,
            id: uuid,
            from,
            to,
            msg,
        }
    }
}

pub type ClientsType = Arc<Mutex<HashMap<String, Client>>>;
pub type AssignmentsType = Arc<Mutex<HashMap<String, Vec<String>>>>;
pub type MessagesType = Arc<Mutex<HashMap<String, Vec<MessageEntry>>>>;

#[derive(Debug, Serialize)]
pub struct RegisterResponse {
    pub id: String,
    pub support_id: String,
}

#[derive(Deserialize, Clone)]
pub struct IdQuery {
    pub id: String,
}

#[derive(Debug, Clone)]
pub struct Clients {
    pub clients: ClientsType,
}
impl Clients {
    pub fn new() -> Clients {
        let clients = Arc::new(Mutex::new(HashMap::new()));
        Clients { clients }
    }
    pub async fn send_message(&self, to: String, msg: ServerMessage) -> Result<(), anyhow::Error> {
        let clients = self.clients.lock().await;
        let client = clients.get(&to).ok_or(anyhow::anyhow!("not found"))?;
        if client.is_online == false {
            return Err(anyhow::anyhow!("client is offline"));
        };
        let sender = client.sender.as_ref().ok_or(anyhow::anyhow!("not found"))?;
        sender.send(msg).await?;
        Ok(())
    }
    pub async fn add(&self, id: String, client: Client) {
        let mut clients = self.clients.lock().await;
        clients.insert(id, client);
    }
    pub async fn remove(&self, id: &str) {
        let mut clients = self.clients.lock().await;
        clients.remove(id).unwrap();
    }
    pub async fn set_offline(&self, id: &str) {
        let mut clients = self.clients.lock().await;
        let client = clients.get_mut(id).unwrap();
        client.is_online = false;
    }
    pub async fn set_online(&self, id: &str) {
        let mut clients = self.clients.lock().await;
        let client = clients.get_mut(id).unwrap();
        client.is_online = true;
    }
    pub async fn get_daddy(&self, id: &str) -> Option<String> {
        let clients = self.clients.lock().await;
        clients.get(id).unwrap().daddy.clone()
    }
}

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

    pub async fn get_clients_for_id(
        Extension(assignments): Extension<AssignmentsType>,
        query: Query<IdQuery>,
    ) -> String {
        serde_json::to_string(&assignments.lock().await.get(&query.id)).unwrap()
    }
    pub async fn get_all_connections(Extension(clients): Extension<ClientsType>) -> String {
        let clients = clients.lock().await;
        serde_json::to_string(&clients.iter().map(|(key, _)| key).collect::<Vec<&String>>())
            .unwrap()
    }
}
