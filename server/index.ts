import express, { Express } from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
dotenv.config();

const app: Express = express();
app.use(cors({ origin: "*" }));
const port = process.env.PORT;
const server = http.createServer(app);

const io = new Server(server, {
  path: "/socket",
  cors: { origin: "*" },
});
const clients: string[] = [];
io.on("connection", (socket) => {
  console.log("a user connected ");
  clients.push(socket.id);
  console.log(clients);
  socket.on("ping", (data) => {
    console.log("ping");
    socket.emit("pong", "pong");
  });
  socket.on("send", (msg) => {
    console.log(msg);
    socket.broadcast.emit("receive", msg);
  });
});
app.get("/clients", (req, res) => {
  res.json({ clients });
});
app.get("/daddy", (req, res) => {
  res.json({ daddy: "prime" });
});
server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
