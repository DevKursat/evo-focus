// --- JAVASCRIPT ---

// DOM Elementlerini Seçme
const timeDisplay = document.getElementById('time-display');
const statusMessage = document.getElementById('status-message');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const progressCircle = document.querySelector('.progress-ring__circle');
const body = document.body;

const radius = progressCircle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;

progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = circumference;

// Zamanlayıcı Ayarları (saniye cinsinden)
const WORK_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

// Durum Değişkenleri
let timer;
let timeLeft = WORK_TIME;
let isPaused = true;
let pomodoroCount = 0;
let currentState = 'work'; // 'work', 'shortBreak', 'longBreak'

// Ses Efekti için AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
}

// İlerleme çubuğunu güncelleyen fonksiyon
function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

// Zamanı formatlayan fonksiyon (örn: 25:00)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Zamanlayıcıyı güncelleyen ana fonksiyon
function updateTimer() {
    timeLeft--;
    timeDisplay.textContent = formatTime(timeLeft);
    
    let totalTime;
    if (currentState === 'work') totalTime = WORK_TIME;
    else if (currentState === 'shortBreak') totalTime = SHORT_BREAK_TIME;
    else totalTime = LONG_BREAK_TIME;

    setProgress(((totalTime - timeLeft) / totalTime) * 100);

    if (timeLeft < 0) {
        clearInterval(timer);
        playSound();
        switchState();
    }
}

// Durumlar arası geçişi yöneten fonksiyon
function switchState() {
    if (currentState === 'work') {
        pomodoroCount++;
        if (pomodoroCount % 4 === 0) {
            currentState = 'longBreak';
            timeLeft = LONG_BREAK_TIME;
            statusMessage.textContent = "Uzun Mola Vakti!";
            body.className = 'long-break-mode';
        } else {
            currentState = 'shortBreak';
            timeLeft = SHORT_BREAK_TIME;
            statusMessage.textContent = "Kısa Mola Vakti!";
            body.className = 'short-break-mode';
        }
    } else {
        currentState = 'work';
        timeLeft = WORK_TIME;
        statusMessage.textContent = "Odaklanma Başladı!";
        body.className = 'focus-mode';
    }
    timeDisplay.textContent = formatTime(timeLeft);
    setProgress(0);
    startTimer(); // Otomatik olarak yeni durumu başlat
}

// Zamanlayıcıyı başlatan fonksiyon
function startTimer() {
    isPaused = false;
    startPauseBtn.textContent = 'Duraklat';
    body.classList.remove('paused');
    timer = setInterval(updateTimer, 1000);
}

// Zamanlayıcıyı duraklatan fonksiyon
function pauseTimer() {
    isPaused = true;
    startPauseBtn.textContent = 'Devam Et';
    body.classList.add('paused');
    clearInterval(timer);
}

// Başlat/Duraklat butonu olayı
startPauseBtn.addEventListener('click', () => {
    if (isPaused) {
        startTimer();
    } else {
        pauseTimer();
    }
});

// Sıfırlama butonu olayı
resetBtn.addEventListener('click', () => {
    clearInterval(timer);
    isPaused = true;
    currentState = 'work';
    timeLeft = WORK_TIME;
    pomodoroCount = 0;
    timeDisplay.textContent = formatTime(timeLeft);
    statusMessage.textContent = "Odaklanmaya Hazır";
    startPauseBtn.textContent = 'Başlat';
    body.className = 'focus-mode';
    setProgress(0);
});

// Başlangıç durumu
function initialize() {
    timeDisplay.textContent = formatTime(timeLeft);
    statusMessage.textContent = "Odaklanmaya Hazır";
    body.className = 'focus-mode';
    setProgress(0);
}

initialize();
