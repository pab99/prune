const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { MongoClient } = require('mongodb');
const socketIo = require('socket.io');
const datosCuriosos = require('./datos-curiosos.js'); // Carga tus datos de Prüne sueltos en la raíz[cite: 1, 2]

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON y servir la carpeta pública original
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Carga de preguntas y contenido base en memoria[cite: 2]
const PREGUNTAS_PATH = path.join(__dirname, 'preguntas.json');
const preguntasTodo = JSON.parse(fs.readFileSync(PREGUNTAS_PATH, 'utf8'));

// CONFIGURACIÓN DE PERSISTENCIA (MongoDB Atlas dinámico)[cite: 2]
const mongoUri = process.env.MONGO_URI; 
let dbCollection = null;
let jugadores = {}; // Estructura original para mantener estados en tiempo real[cite: 2]

async function conectarBaseDeDatos() {
    if (!mongoUri) {
        console.log("⚠️ ALERTA: No se detectó la variable MONGO_URI en Render. El servidor funcionará de forma efímera en memoria.");
        return;
    }
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        
        // Base de datos aislada para la marca PRÜNE sin mezclar con la anterior
        const db = client.db('trivia_prune_db'); 
        dbCollection = db.collection('ranking'); 
        
        console.log("🚀 CONECTADO EXITOSAMENTE A MONGO DB ATLAS (BASE: trivia_prune_db)");

        // Sincronización original: recupera el historial de usuarios guardados en la nube[cite: 2]
        const historial = await dbCollection.find({}).toArray();
        historial.forEach(j => {
            jugadores[j.username] = j;
        });
        console.log(`📊 Se restauraron ${historial.length} usuarios desde MongoDB.`);
    } catch (error) {
        console.error("❌ ERROR CRÍTICO AL CONECTAR A MONGO DB:", error);
    }
}

conectarBaseDeDatos();

// ENDPOINTS DE LA API (Consumidos por tu script.js original)[cite: 1, 2]
app.get('/api/preguntas', (req, res) => {
    // Devuelve el banco completo de Prüne
    res.json(preguntasTodo);
});

app.get('/api/contenido', (req, res) => {
    fs.readFile(path.join(__dirname, 'contenido.json'), 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error al leer contenido');
        const contenido = JSON.parse(data);
        // Inyecta dinámicamente los datos curiosos de la marca[cite: 2]
        contenido.datosCuriosos = datosCuriosos;
        res.json(contenido);
    });
});

// LÓGICA DE WEBSOCKETS (Mantiene intacto tu sistema competitivo multijugador)[cite: 2]
io.on('connection', (socket) => {
    console.log(`🔌 Nuevo cliente conectado: ${socket.id}`);

    // Registro de jugador o login original[cite: 2]
    socket.on('joinGame', async (username) => {
        socket.username = username;
        
        if (!jugadores[username]) {
            jugadores[username] = {
                username: username,
                score: 0,
                currentQuestion: 0,
                completed: false,
                lastActive: new Date()
            };
            
            // Persistencia inmediata en Mongo si está disponible[cite: 2]
            if (dbCollection) {
                try {
                    await dbCollection.updateOne(
                        { username: username },
                        { $set: jugadores[username] },
                        { upsert: true }
                    );
                } catch (err) {
                    console.error("Error al guardar nuevo usuario en Mongo:", err);
                }
            }
        }
        
        // Envía el estado actualizado a todos los clientes conectados[cite: 2]
        io.emit('updateDashboard', Object.values(jugadores));
    });

    // Actualización de puntajes en tiempo real cuando responden correctamente[cite: 2]
    socket.on('updateScore', async (data) => {
        const { username, score, currentQuestion, completed } = data;
        
        if (jugadores[username]) {
            jugadores[username].score = score;
            jugadores[username].currentQuestion = currentQuestion;
            jugadores[username].completed = completed;
            jugadores[username].lastActive = new Date();

            // Refleja los cambios en Atlas[cite: 2]
            if (dbCollection) {
                try {
                    await dbCollection.updateOne(
                        { username: username },
                        { $set: jugadores[username] }
                    );
                } catch (err) {
                    console.error("Error al actualizar puntaje en Mongo:", err);
                }
            }

            // Actualiza el dashboard de métricas visible en tiempo real[cite: 2]
            io.emit('updateDashboard', Object.values(jugadores));
        }
    });

    // Desconexión del cliente[cite: 2]
    socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
});

// Endpoint fallback para SPA/Rutas de Express hacia el frontend[cite: 1, 2]
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Arranque del servidor HTTP integrado con Socket.io[cite: 2]
server.listen(PORT, () => {
    console.log(`🚀 Servidor de Trivia PRÜNE corriendo en el puerto ${PORT}`);
});
