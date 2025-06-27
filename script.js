const form = document.getElementById('configForm');
const timerDisplay = document.getElementById('timerDisplay');
const roundDisplay = document.getElementById('roundDisplay');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const installBtn = document.getElementById('installBtn');
const countdownMessage = document.getElementById('countdownMessage');
const bell1 = document.getElementById('bell1'); // iniciar y descanso->trabajo
const bell2 = document.getElementById('bell2'); // trabajo->descanso
const bell3 = document.getElementById('bell3'); // fin total
const body = document.body;

let interval = null;
let countdownInterval = null;
let totalRounds = 0;
let currentRound = 0;
let isWorking = true; // true = trabajo, false = descanso
let remainingSeconds = 0;
let timerConfig = null;
let deferredPrompt = null;

form.addEventListener('submit', (e) => {
  e.preventDefault();
  startInitialCountdown();
});

pauseBtn.addEventListener('click', () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
    pauseBtn.textContent = 'Continuar';
  } else {
    runTimer();
    pauseBtn.textContent = 'Pausar';
  }
});

resetBtn.addEventListener('click', resetTimer);

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      installBtn.style.display = 'none';
    }
    deferredPrompt = null;
  }
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        // Registro exitoso
        // console.log('ServiceWorker registrado:', registration);
      })
      .catch(error => {
        // console.log('Error al registrar ServiceWorker:', error);
      });
  });
}

function startInitialCountdown() {
  // Leer valores y convertir todo a segundos
  const workMinutes = parseInt(document.getElementById('workMinutes').value, 10) || 0;
  const workSeconds = parseInt(document.getElementById('workSeconds').value, 10) || 0;
  const restMinutes = parseInt(document.getElementById('restMinutes').value, 10) || 0;
  const restSeconds = parseInt(document.getElementById('restSeconds').value, 10) || 0;
  totalRounds = parseInt(document.getElementById('rounds').value, 10) || 1;

  if (workMinutes === 0 && workSeconds === 0) {
    alert('El tiempo de entrenamiento no puede ser 0.');
    return;
  }
  if (restMinutes === 0 && restSeconds === 0) {
    alert('El tiempo de descanso no puede ser 0.');
    return;
  }
  if (totalRounds < 1) {
    alert('La cantidad de rondas debe ser al menos 1.');
    return;
  }

  timerConfig = {
    workDuration: workMinutes * 60 + workSeconds,
    restDuration: restMinutes * 60 + restSeconds,
  };

  currentRound = 1;
  isWorking = true;
  remainingSeconds = timerConfig.workDuration;

  // Mostrar mensaje inicial con cuenta regresiva 5s
  form.style.display = 'none';
  pauseBtn.style.display = 'none'; // Oculta pausa
  resetBtn.style.display = 'none'; // Oculta reset
  countdownMessage.style.display = 'block';
  timerDisplay.textContent = '00:00';
  roundDisplay.textContent = '';
  setBackground('#1e293b'); // bg-slate-800 oscuro inicial

  let countdown = 5;
  countdownMessage.textContent = `Iniciando en ${countdown} segundos...`;

  countdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownMessage.textContent = `Iniciando en ${countdown} segundos...`;
    } else {
      clearInterval(countdownInterval);
      countdownMessage.textContent = '';
      pauseBtn.style.display = 'inline-block'; // Muestra pausa
      resetBtn.style.display = 'inline-block'; // Muestra reset
      playBell1(); // Solo acá suena bell1 al empezar el timer real
      startTimer();
    }
  }, 1000);
}

function startTimer() {
  updateDisplay();
  updateRoundDisplay();
  setBackground();
  runTimer();
}

function runTimer() {
  interval = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds < 0) {
      if (isWorking) {
        // Si es la última ronda, termina después del entrenamiento
        if (currentRound === totalRounds) {
          clearInterval(interval);
          interval = null;
          playBell3(); // fin total
          alert('¡Entrenamiento terminado!');
          resetTimer();
          return;
        } else {
          isWorking = false;
          remainingSeconds = timerConfig.restDuration;
          playBell2(); // trabajo -> descanso
        }
      } else {
        currentRound++;
        isWorking = true;
        remainingSeconds = timerConfig.workDuration;
        playBell1(); // descanso -> trabajo
      }
      setBackground();
      updateRoundDisplay();
    }
    updateDisplay();
  }, 1000);
}

function updateDisplay() {
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  timerDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateRoundDisplay() {
  roundDisplay.textContent = `Ronda ${currentRound} de ${totalRounds} - ${isWorking ? 'Entrenando' : 'Descansando'}`;
}

function resetTimer() {
  clearInterval(interval);
  interval = null;
  clearInterval(countdownInterval);
  countdownInterval = null;
  form.style.display = 'flex';
  pauseBtn.style.display = 'none';
  resetBtn.style.display = 'none';
  countdownMessage.textContent = '';
  timerDisplay.textContent = '00:00';
  roundDisplay.textContent = '';
  setBackground('#1a202c'); // bg-gray-900 default dark
}

function setBackground(color) {
  if (color) {
    body.style.backgroundColor = color;
  } else {
    if (isWorking) {
      // Azul claro, suave
      body.style.backgroundColor = '#60a5fa'; // tailwind blue-400 más light
    } else {
      // Rojo suave
      body.style.backgroundColor = '#fca5a5'; // tailwind red-300 light
    }
  }
}

function playBell1() {
  bell1.currentTime = 0;
  bell1.play();
}

function playBell2() {
  bell2.currentTime = 0;
  bell2.play();
}

function playBell3() {
  bell3.currentTime = 0;
  bell3.play();
}