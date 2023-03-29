use axum::extract::ws::{Message, WebSocket};
use serde::{Deserialize, Serialize};
use tokio::{select, sync::mpsc};

use crate::{AssignmentsType, ClientsType};

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
    Message {
        message: String,
        room: String,
    },
    Image {
        bytes: Vec<u8>,
        message: String,
        room: String,
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

pub async fn handle_socket(
    mut socket: WebSocket,
    state: ClientsType,
    assignments: AssignmentsType,
    id: String,
) {
    let handle_disconnect = || async {
        let mut clients = state.lock().await;
        let daddy_id = &clients.get(&id).expect("client to exist").daddy;
        //WARN: Come back here when i will be better at rust and at namings
        match daddy_id {
            Some(dad_id) => {
                //notify daddy that i leave
                let daddy = clients.get(dad_id).expect("to have dad");
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
                    .filter(|ids| ids.as_str() != id.as_str())
                    .map(|ids| ids.clone())
                    .collect();
                assignments.insert(dad_id.clone(), filtered);
            }
            None => (),
        }
        clients.remove(&id);
        println!("Client disconnected");
    };

    let (tx, mut rx) = mpsc::channel(100);
    {
        let state = state.clone();
        let mut state = state.lock().await;
        match state.get(&id) {
            Some(_) => {
                let client = state.get_mut(&id).expect("client to exist");
                client.sender = Some(tx.clone())
            }
            None => {
                println!("{} is not registered", id);
                return;
            }
        };
    }

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
                                    Some(peer_tx) => peer_tx.send(ServerMessage::Message { message, room }).await.unwrap(),
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
                println!(" {:?} got = {:?}", id,res);
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
