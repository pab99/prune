let preguntas = [];
let datosCuriosos = [];
let indicePreguntaActual = 0;

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const resPreguntas = await fetch('/api/preguntas');
        preguntas = await resPreguntas.json();

        const resContenido = await fetch('/api/contenido');
        const contenido = await resContenido.json();
        datosCuriosos = contenido.datosCuriosos;

        mostrarPregunta();
        mostrarDatoCuriosoAleatorio();
    } catch (error) {
        console.error('Error cargando los datos de la trivia:', error);
    }

    document.getElementById('next-btn').addEventListener('click', siguientePregunta);
});

function mostrarPregunta() {
    const preguntaActual = preguntas[indicePreguntaActual];
    document.getElementById('question-text').textContent = preguntaActual.pregunta;
    
    const containerOpciones = document.getElementById('options-container');
    containerOpciones.innerHTML = '';

    preguntaActual.opciones.forEach((opcion, index) => {
        const boton = document.createElement('button');
        boton.textContent = opcion;
        boton.classList.add('btn-option');
        boton.addEventListener('click', () => verificarRespuesta(index));
        containerOpciones.appendChild(boton);
    });

    document.getElementById('feedback-box').classList.add('hidden');
}

function verificarRespuesta(indiceSeleccionado) {
    const preguntaActual = preguntas[indicePreguntaActual];
    const feedbackBox = document.getElementById('feedback-box');
    const feedbackText = document.getElementById('feedback-text');

    if (indiceSeleccionado === preguntaActual.correcta) {
        feedbackText.textContent = `¡Correcto! ${preguntaActual.explicacion}`;
        feedbackText.style.color = '#27ae60';
    } else {
        feedbackText.textContent = `Incorrecto. ${preguntaActual.explicacion}`;
        feedbackText.style.color = '#c0392b';
    }

    feedbackBox.classList.remove('hidden');
}

function siguientePregunta() {
    indicePreguntaActual++;
    if (indicePreguntaActual < preguntas.length) {
        mostrarPregunta();
        mostrarDatoCuriosoAleatorio();
    } else {
        // Reiniciar el juego al terminar todas las preguntas
        indicePreguntaActual = 0;
        alert('¡Completaste la Trivia de PRÜNE! Volviendo a empezar.');
        mostrarPregunta();
        mostrarDatoCuriosoAleatorio();
    }
}

function mostrarDatoCuriosoAleatorio() {
    if (datosCuriosos.length > 0) {
        const indiceAleatorio = Math.floor(Math.random() * datosCuriosos.length);
        document.getElementById('fun-fact-display').textContent = datosCuriosos[indiceAleatorio];
    }
}