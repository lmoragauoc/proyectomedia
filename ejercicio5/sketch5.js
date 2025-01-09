let sound; //variable para almacenar el archivo de audio
let playButton; //variable para cambiar entre reproducir y pausar el audio
let volumeSlider, speedSlider, panSlider; // los 3 sliders para ajustar el volumen, la velocidad de reproducción y la panorámica estéreo del audio
let filter, delayEffect; //variable para controlar el filtro pasa bajos. Se añade el efecto delay
let freqSlider, resSlider; //los 2 sliders que ajustan la frecuencia de corte del filtro y la resonancia alrededor de la frecuencia de corte.
let delayTimeSlider, feedbackSlider; //Controles del efecto delay
let reverbTimeSlider, reverbMixSlider; // Sliders para el efecto de reverberación
let webcam; // Variable para la captura de la webcam
let myVideo; // Variable para el vídeo externo
let amplitude; //variable para medir la amplitud del sonido
let videoWidth = 640, videoHeight = 480; //Dimensiones iniciales del vídeo/webcam
let rotationAngle = 0; // Variable para controlar el ángulo de rotación
let rotateClockwise = false; // Estado de la tecla [a]
let rotateCounterClockwise = false; // Estado de la tecla [s]
let currentFilters = []; // Lista para gestionar filtros activos
let showCamera = true; // Alternar entre webcam y vídeo externo, inicialmente muestra la webcam

// Máscara de convolución (laplaciana) para la detección de contornos
const laplacianMatrix = [
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
];


//Se carga el archivo de sonido antes que se ejecute la función setup para que esté litos antes de ejecutar cualquier otra parte del código.
function preload() {
    sound = loadSound('../PEC2.mp3'); // Ruta ajustada
}

function setup() {
    createCanvas(800, 600); //Se ajusta el tamaño del canvas para la webcam y los controles

    //Configuración de la webcam
    webcam = createCapture(VIDEO); //Se inicia la captura de la webcam
    webcam.size(videoWidth, videoHeight); // Tamaño del video igual al del canvas
    webcam.hide(); // Se oculta el DOM de la webcam para que solo aparezca en el canvas

    //Carga del vídeo externo
    myVideo = createVideo('../practica1_videofinal.mp4');
    myVideo.hide(); // Ocultamos el DOM del vídeo

    // Callback para cuando el navegador haya cargado los datos suficietes para que la reproducción pueda comenzar.
    myVideo.onloadeddata = () => {
        // Iniciar el vídeo en loop una vez que esté cargado
        myVideo.loop();
    };

    
    // Botón Play/Stop
    playButton = createButton('Play'); //Se crea el botón HTML con la etiqueta "Play" y se guarda en la variable playButton
    playButton.position(10, 10); //Se ajusta la posición del botón en la pantalla.
    playButton.mousePressed(togglePlay); //Cada vez que se haga clic en el botón, la función togglePlay se ejecuta para reproducir o pausar el audio.

    // Sliders de control
    volumeSlider = createSlider(0, 1, 0.5, 0.01); //Se crea el control deslizante para el volumen, con valor mínimo cero, valor máximo 1, valor inicial 0.5 e incrementos de 0.01.
    
    volumeSlider.position(10, 50); //Se coloca en la posición

    speedSlider = createSlider(0.5, 2, 1, 0.01); //Se crea el control deslizante para la velocidad, con un rango de mitad de velocidad (0.5) al doble de velocidad (2), el valor inicial es 1 (velocidad normal) y el incremento es de 0.01.

    speedSlider.position(10, 80); //Se coloca en la posición

    panSlider = createSlider(-1, 1, 0, 0.01); //Se crea el slider para controlar la panorámica estéreo. El rango es desde -1 (completamente a la izquierda) a 1 (completamente a la derecha), el valor inicial es cero (centrado)

    panSlider.position(10, 110);

    // Filtro pasa bajos
    filter = new p5.LowPass(); //Se crea el filtro pasa bajo

    freqSlider = createSlider(10, 22050, 22050, 1); //Se crea el slider para controlar la frecuencia de corte. El rango es de 10 Hz a 22050 Hz, el valor inicial es 22050 Hz.

    freqSlider.position(10, 140);

    resSlider = createSlider(0.1, 10, 1, 0.1); //Se crea el slider para la controlar la resonancia (énfasis en las frecuencias cercanas a la frecuencia de corte). El rango va desde 0.1 (énfasis prácticamente nulo) a 10 (énfasis fuerte). El valor inicial es 1.

    resSlider.position(10, 170);

    //Efecto delay
    delayEffect = new p5.Delay(); //Se crea una instancia del efecto delay
    delayTimeSlider = createSlider(0, 1, 0.2, 0.01); // Slider que controla el tiempo de retardo. El valor mínimo es cero (sin retardo), valor máximo es un segundo, el valor inicial 0.2 segundos y el incremento mínimo 0.01 segundos.
    delayTimeSlider.position(10, 200);

    feedbackSlider = createSlider(0, 0.9, 0.5, 0.01); // Se crea un slider para ajustar el eco del delay. El valor mínimo es 0 (sin eco), el valor máximo es 0.9 (eco prolongado), el varlo inicial 0.5 y el incremento mínimo 0.01.
    feedbackSlider.position(10, 230);

    //Efecto reverberacion
    reverbEffect = new p5.Reverb();
    reverbTimeSlider = createSlider(0, 5, 2, 0.1).position(10, 260);
    reverbMixSlider = createSlider(0, 1, 0.5, 0.01).position(10, 290);

    // Conectar el sonido a los efectos
    sound.disconnect(); //Se desconecta la salida predeterminada
    sound.connect(filter); //Primero se conecta al filtro pasa bajos
    filter.connect(delayEffect); // Después se conecta del filtro pasa bajos al delay
    delayEffect.connect(reverbEffect); //A continuación se conecta del delay al efecto reverberación

    //Se configura el análisis de la amplitud
    amplitude = new p5.Amplitude();
}

function draw() {
    background(200);

    // Calcular la rotación
    if (rotateClockwise) {
        rotationAngle += radians(1); // Se incrementa el ángulo en sentido horario
    }
    if (rotateCounterClockwise) {
        rotationAngle -= radians(1); // Se incrementa el ángulo en sentido antihorario
    }

    // Se crea un buffer para procesar la fuente (webcam o vídeo)
    let buffer = createGraphics(videoWidth, videoHeight);

    //Seleccionar la webcam o el vídeo
    if (showCamera) {
        buffer.image(webcam, 0, 0, videoWidth, videoHeight);
    } else {
        // Aquí no necesitamos condicionar el loop del vídeo,
        // ya se inicia automáticamente cuando está listo (onloadeddata).
        buffer.image(myVideo, 0, 0, videoWidth, videoHeight);
    }

    //Se aplican los filtros activos en el buffer
    currentFilters.forEach((filterName) => {
        switch (filterName) {
            case 'negative':
                buffer.filter(INVERT); // Aplicar negativo al buffer
                break;
            case 'posterization':
                buffer.filter(POSTERIZE, 4); // Aplicar posterización al buffer
                break;
            case 'binarization':
                buffer.filter(THRESHOLD, 0.4); // Aplicar binarización al buffer
                break;
            case 'erosion':
                buffer.filter(ERODE); // Aplicar erosión al buffer
                break;
            case 'contour':
                buffer.loadPixels(); // Cargar píxeles para el filtro personalizado
                applyLaplacian(buffer); // Aplicar detección de contornos
                buffer.updatePixels(); // Actualizar píxeles después del procesamiento
                break;
        }
    });

    //Se escala según la amplitud del sonido
    let level = amplitude.getLevel();
    let newWidth = map(level, 0, 0.3, 200, 640);
    let newHeight = map(level, 0, 0.3, 150, 480);


    // Se dibuja el buffer en el canvas con rotación y escalado
    push();
    translate(width / 2, height / 2);
    rotate(rotationAngle);
    translate(-width / 2, -height / 2);
    image(buffer, (width - newWidth) / 2, (height - newHeight) / 2, newWidth, newHeight);
    pop();
    

    //Etiquetas de los sliders
    fill(255);//Se define el blanco como color de relleno, para hacerlo visible sobre el fondo o la captura de vídeo.
    textSize(14);
    text('Volumen', 10, 70);
    text('Velocidad', 10, 100);
    text('Panorámica', 10, 130);
    text('Frecuencia Corte', 10, 160);
    text('Resonancia', 10, 190);
    text('Delay Time', 10, 220);
    text('Feedback', 10, 250);
    text('Reverb Time', 10, 280);
    text('Reverb Mix', 10, 310);

    // Se aplican las configuraciones
    sound.setVolume(volumeSlider.value());
    sound.rate(speedSlider.value());
    sound.pan(panSlider.value());

    filter.freq(freqSlider.value()); //Ajusta la frecuencia de corte del filtro pasa bajos.
    filter.res(resSlider.value()); //Ajusta la resonancia del filtro pasa bajos

    delayEffect.delayTime(delayTimeSlider.value()); // Ajusta el tiempo de retardo
    delayEffect.feedback(feedbackSlider.value()); // Ajustar el eco del delay

    reverbEffect.process(sound, reverbTimeSlider.value(), reverbMixSlider.value());// Controla la duración de la reverberación y la parte de la señal orginal (sin reverberación) que se mezcla con la señal procesada (con reverberación)
}

function keyPressed() {
    if (key === 'l') {
        showCamera = !showCamera;
        if (showCamera) {
            myVideo.pause(); // Pausar el vídeo si se muestra la cámara
        } else {
            myVideo.loop(); // Reproducir el vídeo en bucle si se muestra el vídeo
        }
    }
    let filterToAdd = '';
    switch (key) {
        case '1':
            filterToAdd = 'negative';
            break;
        case '2':
            filterToAdd = 'binarization';
            break;
        case '3':
            filterToAdd = 'erosion';
            break;
        case '4':
            filterToAdd = 'posterization';
            break;
        case 'd':
            filterToAdd = 'contour'; // Detección de contornos
             break;
        case 'a':
            rotateClockwise = true; // Rotar en el sentido de las agujas del reloj
            break;
        case 's':
            rotateCounterClockwise = true; // Rotar en sentido contrario
            break;
    }
    if (filterToAdd && !currentFilters.includes(filterToAdd)) {
        currentFilters.push(filterToAdd); // Añadir filtro si no está activo
    }
}

function keyReleased() {
    let filterToRemove = '';
    switch (key) {
        case '1':
            filterToRemove = 'negative';
            break;
        case '2':
            filterToRemove = 'binarization';
            break;
        case '3':
            filterToRemove = 'erosion';
            break;
        case '4':
            filterToRemove = 'posterization';
            break;
        case 'd':
            filterToRemove = 'contour'; // Detección de contornos
            break;
        case 'a':
            rotateClockwise = false; // Detener rotación en sentido horario
            break;
        case 's':
            rotateCounterClockwise = false; // Detener rotación en sentido antihorario
            break;
    }
    if (filterToRemove) {
        currentFilters = currentFilters.filter(f => f !== filterToRemove); // Quitar filtro activo
    }
}

//función para aplicar la convolución de la misma forma que en el ejercicio 4 de la Práctica 1
function applyLaplacian(buffer) {
    let tempPixels = [...buffer.pixels];
    let w = buffer.width;
    let h = buffer.height;

    for (let x = 1; x < w - 1; x++) {
        for (let y = 1; y < h - 1; y++) {
            let sum = 0;
            for (let kx = -1; kx <= 1; kx++) {
                for (let ky = -1; ky <= 1; ky++) {
                    let weight = laplacianMatrix[kx + 1][ky + 1]; // Tomamos el peso desde la matriz global
                    let index = ((x + kx) + (y + ky) * w) * 4;
                    let gray = (tempPixels[index] + tempPixels[index + 1] + tempPixels[index + 2]) / 3; // Promedio de RGB
                    sum += weight * gray;
                }
            }
            let index = (x + y * w) * 4;
            let edge = constrain(sum, 0, 255); // Limitar valores entre 0 y 255
            buffer.pixels[index] = edge;
            buffer.pixels[index + 1] = edge;
            buffer.pixels[index + 2] = edge;
        }
    }
}

//Función para controlar si el audio se está reproduciendo o no y alterna entre play y stop
function togglePlay() {
    if (sound.isPlaying()) {
        sound.pause();
        playButton.html('Play');
        myVideo.pause();
    } else {
        sound.play();
        playButton.html('Stop');
        if (!showCamera) {
            myVideo.loop();
        }
    }
}
