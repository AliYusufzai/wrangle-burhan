const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const corsOptions = {
    origin: "*", // Allow requests from any origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
};

const app = express();
app.use(cors()); // Use the cors middleware
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 5000;

app.get("/", function (req, res) {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send("<h1>Hello from node app</h1>");
});
const rooms = {};

io.on("connection", (socket) => {
    socket.on("joinRoom", (roomName, username) => {
        socket.join(roomName);

        if (!rooms[roomName]) {
            rooms[roomName] = {
                users: [],
            };
        }

        if (rooms[roomName].users.length < 2) {
            rooms[roomName].users.push({
                id: socket.id,
                username,
            });

            // Notify the client that they are a host and can initiate video chat
            socket.emit("hostVideo", rooms[roomName].users);
        } else {
            rooms[roomName].users.push({
                id: socket.id,
                username,
            });

            // Notify the client that they are in the queue and cannot initiate video chat
            socket.emit("hostVideo", rooms[roomName].users);
        }
    });

    socket.on("sendMessage", (roomName, message, username) => {
        io.to(roomName).emit("receiveMessage", { username, message });
    });

    socket.on("disconnect", () => {
        for (const roomName in rooms) {
            const userIndex = rooms[roomName].users.findIndex(
                (user) => user.id === socket.id
            );
            if (userIndex !== -1) {
                rooms[roomName].users.splice(userIndex, 1);
                io.to(roomName).emit("hostVideo", rooms[roomName].users);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
