const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

app.use(express.static(__dirname + '/public'));

const usuarios = {};

io.on('connection', (socket) => {
    console.log('✅ Conectado:', socket.id);

    const lista = Object.keys(usuarios).map(id => ({
        id,
        avatar: usuarios[id].avatar || '👾',
        nombre: usuarios[id].nombre || 'Jugador',
        x: usuarios[id].x || 0,
        z: usuarios[id].z || 0
    }));
    socket.emit('usuarios_existentes', lista);

    socket.on('seleccionar_avatar', (data) => {
        console.log(`🎭 ${data.nombre} eligió ${data.avatar}`);
        usuarios[socket.id] = {
            avatar: data.avatar || '👾',
            nombre: data.nombre || 'Jugador',
            x: 0,
            z: 0
        };
        io.emit('nuevo_avatar', {
            id: socket.id,
            avatar: usuarios[socket.id].avatar,
            nombre: usuarios[socket.id].nombre
        });
        io.emit('usuarios_conectados', Object.keys(usuarios).length);
        io.emit('bienvenida_chat', { nombre: data.nombre });
    });

    socket.on('mensaje_chat', (data) => {
        io.emit('mensaje_chat', data);
    });

    socket.on('movimiento', (data) => {
        if (usuarios[socket.id]) {
            usuarios[socket.id].x = data.x;
            usuarios[socket.id].z = data.z;
        }
        socket.broadcast.emit('movimiento_otro', {
            id: socket.id,
            x: data.x,
            z: data.z
        });
    });

    socket.on('disconnect', () => {
        const nombre = usuarios[socket.id]?.nombre || 'Alguien';
        console.log('❌ Desconectado:', socket.id);
        delete usuarios[socket.id];
        io.emit('usuario_desconectado', socket.id);
        io.emit('usuarios_conectados', Object.keys(usuarios).length);
        io.emit('despedida_chat', { nombre: nombre });
    });
});

http.listen(3000, () => console.log('🚀 Servidor en http://localhost:3000'));
