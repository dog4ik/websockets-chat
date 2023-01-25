import express, { Express } from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import bodyParser from "body-parser";
dotenv.config();

const app: Express = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
const port = process.env.PORT;
const server = http.createServer(app);

const io = new Server(server, {
  path: "/socket",
  cors: { origin: "*" },
});
const clients: string[] = [];
let godId: string = "";
io.on("connection", (socket) => {
  console.log("a user connected ");

  clients.push(socket.id);
  console.log(clients);
  socket.on("ping", (data) => {
    console.log("ping");
    socket.emit("pong", "pong");
  });
  socket.on("send", (msg, room) => {
    console.log(msg);
    socket.to(room).emit("receive", msg);
  });
  socket.on("disconnect", (reason) => {
    console.log(reason);
  });
});
app.get("/clients", (req, res) => {
  res.json({ clients: clients.filter((cl) => cl !== godId) });
});
app.post("/begod", (req, res) => {
  godId = req.body.godId;
  res.status(200).send();
});
app.get("/getgod", (req, res) => {
  res.status(200).json({ godId });
});
server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
