use axum::extract::ws::{Message, WebSocket};
use serde::{Deserialize, Serialize};
use tokio::{select, sync::mpsc};

use crate::{
    state::{Client, MessageEntry, MessageType, MessagesStore},
    Assignments, Clients,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum ClientMessage {
    Message {
        message: String,
        to: String,
    },
    Image {
        bytes: Vec<u8>,
        message: Option<String>,
        to: String,
    },
    Disconnect,
    Read {
        to: String,
        id: String,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum ServerMessage {
    Open { id: String, daddy: Option<String> },
    Message(MessageEntry),
    Switch { id: Option<String> },
    Update,
    Disconnect,
    SendResult { id: String },
}

fn process_msg(msg: &Message) -> anyhow::Result<ClientMessage> {
    if msg.to_text()?.len() == 0 {
        return Err(anyhow::anyhow!("empty request"));
    }
    println!("msg: {}", msg.to_text()?);
    let cl: ClientMessage = serde_json::from_str(msg.to_text()?)?;
    Ok(cl)
}

struct Connection {
    socket: WebSocket,
    id: String,
}

async fn send_message(socket: &mut WebSocket, msg: &ServerMessage) -> Result<(), axum::Error> {
    socket
        .send(Message::Text(
            serde_json::to_string(msg).expect("always to convert"),
        ))
        .await
}

impl Connection {
    pub fn new(socket: WebSocket) -> Connection {
        let id = uuid::Uuid::new_v4().to_string();
        Connection { socket, id }
    }
    pub fn from_id(socket: WebSocket, id: String) -> Connection {
        Connection { socket, id }
    }
    pub async fn _send(self) -> Result<(), axum::Error> {
        let mut socket = self.socket;
        socket.send(Message::Text("text".to_string())).await
    }
    pub async fn _disconnect(self) {
        self.socket.close().await.unwrap();
    }
}

pub async fn handle_socket(
    socket: WebSocket,
    clients: Clients,
    assignments: Assignments,
    msg_store: MessagesStore,
    id: Option<String>,
    is_support: Option<bool>,
) {
    //TODO: graceful socket disconnect
    let (tx, mut rx) = mpsc::channel(100);
    let mut connection = match id {
        Some(id) => {
            match clients.clients.lock().await.get_mut(&id) {
                Some(client) => {
                    client.sender = Some(tx.clone());
                }
                //Id is fake so get him out
                None => return,
            };
            Connection::from_id(socket, id)
        }
        None => {
            //WARN: Needs refactoring
            let connection = Connection::new(socket);
            if is_support.is_none() {
                //TODO: await for help. Blocking?
                if let Some(papa_id) = assignments.add_client(connection.id.clone()).await {
                    clients
                        .send_message(papa_id.clone(), ServerMessage::Update)
                        .await
                        .unwrap();
                    clients
                        .add(
                            connection.id.clone(),
                            Client {
                                sender: Some(tx.clone()),
                                is_support: false,
                                is_online: true,
                                daddy: Some(papa_id),
                            },
                        )
                        .await;
                } else {
                    clients
                        .add(
                            connection.id.clone(),
                            Client {
                                sender: Some(tx.clone()),
                                is_support: false,
                                is_online: true,
                                daddy: None,
                            },
                        )
                        .await;
                }
            }
            connection
        }
    };
    if let Some(_) = is_support {
        clients
            .add(
                connection.id.clone(),
                Client {
                    is_support: true,
                    sender: Some(tx.clone()),
                    is_online: true,
                    daddy: None,
                },
            )
            .await;
        assignments.add_support(connection.id.clone()).await;
        let assignments = assignments.assignments.lock().await;
        let orphans = assignments.get(&connection.id).expect("to exist");
        for orphan in orphans {
            clients
                .send_message(
                    orphan.clone(),
                    ServerMessage::Switch {
                        id: Some(connection.id.clone()),
                    },
                )
                .await
                .unwrap();
        }
    }
    let socket = &mut connection.socket;

    send_message(
        socket,
        &ServerMessage::Open {
            id: connection.id.clone(),
            daddy: {
                clients
                    .clients
                    .lock()
                    .await
                    .get(&connection.id)
                    .expect("client to exist")
                    .daddy
                    .clone()
            },
        },
    )
    .await
    .unwrap();
    let handle_disconnect = || async {
        let cl = clients.clients.lock().await;
        let me = cl.get(&connection.id).expect("to exist").clone();
        drop(cl);
        if me.is_support {
            let orphans = assignments.remove_support(&connection.id).await;
            for client in orphans {
                let daddy = assignments.add_client(client.clone()).await;
                match daddy {
                    Some(daddy) => {
                        clients
                            .send_message(daddy.clone(), ServerMessage::Update)
                            .await
                            .unwrap();
                        clients
                            .send_message(client, ServerMessage::Switch { id: Some(daddy) })
                            .await
                            .unwrap();
                    }
                    //TODO: now my client is orphan
                    None => {
                        clients
                            .send_message(client, ServerMessage::Switch { id: None })
                            .await
                            .unwrap();
                    }
                }
            }
        } else {
            match &me.daddy {
                Some(dad_id) => {
                    //remove myself
                    assignments.remove_client(&dad_id, &connection.id).await;
                    //notify daddy that i leave
                    clients
                        .send_message(dad_id.clone(), ServerMessage::Update)
                        .await
                        .unwrap();
                }
                None => {
                    println!("removing");
                }
            }
        }
        clients.remove(&connection.id).await;
        assignments.remove_from_wait_list(&connection.id).await;
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

                match msg {
                    ClientMessage::Message { message, to } =>{
                        let msg = MessageType::Text { msg: message };
                        let msg = MessageEntry::new(connection.id.clone(), to.clone(), msg);
                        clients.send_message(to.clone(),ServerMessage::Message(msg.clone())).await.unwrap();
                        // response with send result
                        send_message(socket,&ServerMessage::SendResult { id: msg.id.clone() }).await.unwrap();
                        msg_store.add(msg).await;
                    }
                    ClientMessage::Disconnect => {
                        handle_disconnect().await;
                    },
                    ClientMessage::Image { bytes, message, to } => unimplemented!(),
                    ClientMessage::Read { to, id } => {
                        clients.send_message(to, ServerMessage::SendResult { id }).await.unwrap();
                    },
                };

            }
            res = rx.recv() => {
                if
                    send_message(socket,&res.unwrap())
                        .await.is_err() {
                            handle_disconnect().await;
                            return;
                        }
            },
        }
    }
}
