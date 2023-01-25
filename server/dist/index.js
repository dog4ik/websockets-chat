"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const body_parser_1 = __importDefault(require("body-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use(body_parser_1.default.json());
const port = process.env.PORT;
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    path: "/socket",
    cors: { origin: "*" },
});
const clients = [];
let godId = "";
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
