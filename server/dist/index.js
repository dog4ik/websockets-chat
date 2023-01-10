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
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
const port = process.env.PORT;
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    path: "/socket",
    cors: { origin: "*" },
});
const clients = [];
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
