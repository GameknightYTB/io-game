const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {};
const fallingObjects = [];

setInterval(() => {
    // Faire tomber des objets aléatoirement
    fallingObjects.push({
        x: Math.random() * 800,
        y: 0,
        speed: 2 + Math.random() * 3
    });
    if (fallingObjects.length > 50) fallingObjects.shift();
}, 1000);

io.on('connection', (socket) => {
    console.log(`New player: ${socket.id}`);
    players[socket.id] = { x: 400, y: 600, vx: 0, vy: 0 };

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].vx = data.vx;
            players[socket.id].vy = data.vy;
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

setInterval(() => {
    // Met à jour la position des joueurs
    for (const id in players) {
        const player = players[id];
        player.x += player.vx;
        player.y += player.vy;
        // collisions avec les limites
        if (player.x < 0) player.x = 0;
        if (player.x > 800) player.x = 800;
        if (player.y < 0) player.y = 0;
        if (player.y > 600) player.y = 600;
    }

    // Met à jour la chute des objets
    for (const obj of fallingObjects) {
        obj.y += obj.speed;
    }

    io.emit('state', { players, fallingObjects });
}, 1000 / 30); // 30 fps

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Listening on *:3000');
});
