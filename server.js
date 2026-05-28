const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rutas para los datos del juego
app.get('/api/preguntas', (req, res) => {
    fs.readFile(path.join(__dirname, 'preguntas.json'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error al leer las preguntas' });
        res.json(JSON.parse(data));
    });
});

app.get('/api/contenido', (req, res) => {
    fs.readFile(path.join(__dirname, 'contenido.json'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error al leer el contenido' });
        res.json(JSON.parse(data));
    });
});

// Enrutar cualquier otra petición al index principal
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});