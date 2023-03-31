use axum::extract::ws::{Message, WebSocket};
use serde::{Deserialize, Serialize};
use tokio::{select, sync::mpsc};

use crate::{state::Client, AssignmentsType, ClientsType, ServerState};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum ClientMessage {
    Message {
        message: String,
        room: String,
    },
    Image {
        bytes: Vec<u8>,
        message: String,
        room: String,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum ServerMessage {
    Open {
        id: String,
        daddy: Option<String>,
    },
    Message {
        message: String,
        room: String,
        from: String,
    },
    Image {
        bytes: Vec<u8>,
        message: String,
        room: String,
    },
    Switch {
        id: String,
    },
    Update,
    Disconnect,
}

fn process_msg(msg: &Message) -> anyhow::Result<ClientMessage> {
    if msg.to_text()?.len() == 0 {
        return Err(anyhow::anyhow!("empty request"));
    }
    println!("msg: {}", msg.to_text()?);
    let cl: ClientMessage = serde_json::from_str(msg.to_text()?)?;
    Ok(cl)
}
async fn get_some_help(state: AssignmentsType, my_id: &String) -> Option<String> {
    match state
        .lock()
        .await
        .iter_mut()
        .min_by_key(|(_, val)| val.len())
    {
        Some((id, clients)) => {
            clients.push(my_id.clone());
            Some(id.clone())
        }
        None => None,
    }
}

pub async fn handle_socket(
    mut socket: WebSocket,
    state: ClientsType,
    assignments: AssignmentsType,
    id: Option<String>,
    is_support: Option<bool>,
) {
    let (tx, mut rx) = mpsc::channel(100);
    let connection_id = match id {
        Some(id) => {
            match state.lock().await.get_mut(&id) {
                Some(client) => {
                    client.sender = Some(tx.clone());
                }
                //Id is fake so get him out
                None => return,
            };
            id
        }
        None => {
            let id = uuid::Uuid::new_v4().to_string();
            //WARN: Needs refactoring
            if is_support.is_none() {
                //TODO: await for help. Blocking?
                match get_some_help(assignments.clone(), &id).await {
                    Some(papa_id) => {
                        let mut state = state.lock().await;
                        let sender = state.get_mut(&papa_id).unwrap();
                        sender
                            .sender
                            .clone()
                            .unwrap()
                            .send(ServerMessage::Update)
                            .await
                            .unwrap();
                        state.insert(
                            id.clone(),
                            Client {
                                sender: Some(tx.clone()),
                                daddy: Some(papa_id),
                            },
                        );
                    }
                    None => return,
                }
            }
            id
        }
    };
    match is_support {
        Some(_) => {
            state.lock().await.insert(
                connection_id.clone(),
                Client {
                    sender: Some(tx.clone()),
                    daddy: None,
                },
            );
            let mut assginments = assignments.lock().await;
            assginments.insert(connection_id.clone(), vec![]);
        }
        None => (),
    }

    socket
        .send(Message::Text(
            serde_json::to_string(&ServerMessage::Open {
                id: connection_id.clone(),
                daddy: {
                    state
                        .lock()
                        .await
                        .get(&connection_id)
                        .expect("client to exist")
                        .daddy
                        .clone()
                },
            })
            .unwrap(),
        ))
        .await
        .unwrap();
    let handle_disconnect = || async {
        let mut clients = state.lock().await;
        let daddy_id = &clients.get(&connection_id).expect("client to exist").daddy;
        match daddy_id {
            Some(dad_id) => {
                //notify daddy that i leave
                if let Some(daddy) = clients.get(dad_id) {
                    daddy
                        .sender
                        .clone()
                        .expect("daddy to listen")
                        .send(ServerMessage::Update)
                        .await
                        .unwrap();

                    //remove myself
                    let mut assignments = assignments.lock().await;
                    let daddys_clients = assignments.get(dad_id.as_str()).expect("daddy exists");
                    let filtered = daddys_clients
                        .iter()
                        .filter(|ids| ids.as_str() != connection_id.as_str())
                        .map(|ids| ids.clone())
                        .collect();
                    assignments.insert(dad_id.clone(), filtered);
                }
            }
            None => {
                let mut assignments = assignments.lock().await;
                let clients_ids = assignments.get(&connection_id).expect("to exist").clone();
                assignments.remove(&connection_id);
                for client_id in clients_ids {
                    match assignments.iter_mut().min_by_key(|(_, val)| val.len()) {
                        Some((new_dad_id, new_dad_clients)) => {
                            clients
                                .get(&client_id)
                                .expect("to exist")
                                .sender
                                .clone()
                                .unwrap()
                                .send(ServerMessage::Switch {
                                    id: new_dad_id.clone(),
                                })
                                .await
                                .unwrap();
                            new_dad_clients.push(client_id.clone());
                            clients
                                .get(new_dad_id)
                                .expect("to exist")
                                .sender
                                .clone()
                                .unwrap()
                                .send(ServerMessage::Update)
                                .await
                                .unwrap();
                            ()
                        }
                        None => (),
                    };
                }
            }
        }
        clients.remove(&connection_id);
        println!("Client disconnected");
    };

    loop {
        select! {
            msg = socket.recv() =>
            {
                //parse message
                let msg = if let Some(Ok(msg)) = msg {
                    match process_msg(&msg) {
                        Ok(val) => {
                            val
                        },
                        Err(_) => continue,
                    }
                } else {
                    // client disconnected
                    handle_disconnect().await;
                    return;
                };

                let clients = state.lock().await;
                match msg {
                    ClientMessage::Message { message, room } =>
                        match clients.get(&room) {
                            Some(client) => {
                                match &client.sender {
                                    Some(peer_tx) => peer_tx.send(ServerMessage::Message { message, room ,from: connection_id.clone()}).await.unwrap(),
                                    None => println!("client is not available")
                                };

                            }
                            None => {
                                println!("room not found");
                            }
                        }
                    ClientMessage::Image { bytes, message, room } => unimplemented!(),
                };

            }
            res = rx.recv() => {
                if socket
                    .send(Message::from(serde_json::to_string(&res).unwrap()))
                        .await.is_err() {
                            handle_disconnect().await;
                            return;
                        }
            },
        }
    }
}
