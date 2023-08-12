const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const corsOptions = {
    origin: '*', // Allow requests from any origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};


const app = express();
app.use(cors()); // Use the cors middleware
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 5000;

const rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomName, username) => {
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
            socket.emit('hostVideo', roomName);
        } else {
            rooms[roomName].users.push({
                id: socket.id,
                username,
            });
            socket.emit('enqueue');
        }

        io.to(roomName).emit('roomUsers', rooms[roomName].users);
    });

    socket.on('sendMessage', (roomName, message, username) => {
        io.to(roomName).emit('message', { username, message });
    });

    socket.on('disconnect', () => {
        for (const roomName in rooms) {
            const userIndex = rooms[roomName].users.findIndex((user) => user.id === socket.id);
            if (userIndex !== -1) {
                rooms[roomName].users.splice(userIndex, 1);
                io.to(roomName).emit('roomUsers', rooms[roomName].users);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});