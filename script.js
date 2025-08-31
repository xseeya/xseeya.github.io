import * as musicMetadata from 'https://cdn.jsdelivr.net/npm/music-metadata-browser/+esm';

// Элементы DOM
const themeSwitcher = document.querySelector('.theme-switcher');
const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const progressBar = document.getElementById('progress');
const progressContainer = document.querySelector('.progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const albumCover = document.querySelector('.album-cover');
const lyricsLine = document.getElementById('lyrics-line');
const loadingAnimation = document.querySelector('.loading-animation');

// Константы
const darkModeClass = 'dark';
const sunIcon = '🌞';
const moonIcon = '🌓';
const themeKey = 'theme';

// Переменные состояния
let isPlaying = false;
let isDragging = false;
let isPlayingBeforeDrag = false;
let dragPercent = 0;

// Инициализация тултипа времени
const timeTooltip = document.createElement('div');
timeTooltip.classList.add('time-tooltip');
progressContainer.appendChild(timeTooltip);

// Функции управления темой
function toggleTheme() {
    const isDark = document.body.classList.toggle(darkModeClass);
    themeSwitcher.textContent = isDark ? moonIcon : sunIcon;
    localStorage.setItem(themeKey, isDark ? 'dark' : 'light');
}

window.toggleTheme = toggleTheme;

// Функции для работы с аудио
function playPause() {
    if (isPlaying) {
        audioPlayer.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        albumCover.classList.remove('playing');
    } else {
        audioPlayer.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        albumCover.classList.add('playing');
    }
    isPlaying = !isPlaying;
}

function updateProgress() {
    if (!isDragging) {
        const { duration, currentTime } = audioPlayer;
        if (!isNaN(duration)) {
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            currentTimeEl.textContent = formatTime(currentTime);
            durationEl.textContent = formatTime(duration);
        }
    }
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Функции для работы с прогресс баром
function updateDragPosition(e) {
    const rect = progressContainer.getBoundingClientRect();
    const offsetX = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    dragPercent = offsetX / rect.width;
    progressBar.style.width = `${dragPercent * 100}%`;
    const previewTime = dragPercent * audioPlayer.duration;
    currentTimeEl.textContent = formatTime(previewTime);
    updateTooltip(offsetX, previewTime);
}

function updateTooltip(offsetX, time) {
    timeTooltip.textContent = formatTime(time);
    timeTooltip.style.left = `${offsetX}px`;
}

// Функции для работы с громкостью
const volumeWrapper = document.querySelector('.volume-wrapper');
const volumeToggle = document.querySelector('.volume-toggle');
const volumeSlider = document.getElementById('volume-slider');
const volumeBar = document.querySelector('.volume-bar');
let isMuted = false;

function showVolumeBar() {
    volumeBar.classList.add('visible');
}

function hideVolumeBar() {
    volumeBar.classList.remove('visible');
}

// Вспомогательные функции
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Обработчики событий для прогресс бара
progressContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    isPlayingBeforeDrag = !audioPlayer.paused;
    updateDragPosition(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) updateDragPosition(e);
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        audioPlayer.currentTime = dragPercent * audioPlayer.duration;
        updateProgress();
        if (isPlayingBeforeDrag) audioPlayer.play();
        isPlayingBeforeDrag = false;
    }
});

progressContainer.addEventListener('mousemove', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const offsetX = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const percent = offsetX / rect.width;
    const previewTime = percent * audioPlayer.duration;
    updateTooltip(offsetX, previewTime);
    timeTooltip.style.opacity = 1;
});

progressContainer.addEventListener('mouseleave', () => {
    timeTooltip.style.opacity = 0;
});

// Обработчики событий для аудио плеера
playPauseBtn.addEventListener('click', playPause);

audioPlayer.addEventListener('timeupdate', () => {
    updateProgress();
});

audioPlayer.addEventListener('ended', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    albumCover.classList.remove('playing');
    isPlaying = false;
    lyricsLine.classList.remove('slide-in');
    lyricsLine.classList.add('slide-out');
    
    setTimeout(() => {
            document.querySelector('.lyrics-container').classList.remove('visible');
        }, 500);
    });

audioPlayer.addEventListener('play', () => {
    // Отображаем lyrics-container только если песня действительно играет (а не возобновляется после паузы)
    if (isPlaying) {
        const container = document.querySelector('.lyrics-container');
        // В темной теме сначала устанавливаем display: flex, затем добавляем класс visible
                if (document.body.classList.contains(darkModeClass)) {
                    container.style.display = 'flex';
                    // Устанавливаем начальные значения для плавного появления
                    container.style.opacity = '0';
                    container.style.transform = 'translateY(15px)';
                    
                    // Небольшая задержка для срабатывания transition, затем добавляем класс visible
                    requestAnimationFrame(() => {
                        container.classList.add('visible');
                        // Сбрасываем inline стили, чтобы класс visible мог управлять opacity и transform
                        container.style.opacity = '';
                        container.style.transform = '';
                    });
                } else {
                    container.classList.add('visible');
                }
        
        // Force reflow to trigger transition
        void container.offsetHeight;
        
        setTimeout(() => {
            lyricsLine.classList.remove('slide-out');
            lyricsLine.classList.add('slide-in');
            
            // Удаляем класс slide-in после завершения анимации
            setTimeout(() => {
                lyricsLine.classList.remove('slide-in');
            }, 500);
        }, 100);
    }
});

audioPlayer.addEventListener('pause', () => {
    lyricsLine.classList.remove('slide-in');
    lyricsLine.classList.add('slide-out');
    
    setTimeout(() => {
        document.querySelector('.lyrics-container').classList.remove('visible');
        document.querySelector('.links').style.paddingTop = '75px';
    }, 500);
});

// Обработчики событий для управления громкостью
volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value;
    if (audioPlayer.volume > 0) {
        isMuted = false;
        audioPlayer.muted = false;
        volumeToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        volumeWrapper.classList.remove('active');
    } else {
        isMuted = true;
        audioPlayer.muted = true;
        volumeToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        volumeWrapper.classList.add('active');
    }
});

volumeToggle.addEventListener('click', () => {
    volumeWrapper.classList.toggle('active');
    isMuted = !isMuted;
    audioPlayer.muted = isMuted;
    volumeToggle.innerHTML = isMuted
        ? '<i class="fas fa-volume-mute"></i>'
        : '<i class="fas fa-volume-up"></i>';
});

// Показывать ползунок при наведении на иконку
volumeToggle.addEventListener('mouseenter', showVolumeBar);
volumeBar.addEventListener('mouseenter', showVolumeBar);

// Скрывать ползунок при уходе курсора
volumeWrapper.addEventListener('mouseleave', (e) => {
    // Проверяем, что курсор не над ползунком и не над иконкой
    if (!volumeBar.matches(':hover') && !volumeToggle.matches(':hover')) {
        hideVolumeBar();
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Изначально скрываем текст песни
    const lyricsContainer = document.querySelector('.lyrics-container');
    lyricsContainer.classList.remove('visible');
    
    const savedTheme = localStorage.getItem(themeKey);
    if (savedTheme === 'dark') {
        document.body.classList.add(darkModeClass);
        themeSwitcher.textContent = moonIcon;
    } else {
        themeSwitcher.textContent = sunIcon;
    }
    
    // В темной теме устанавливаем display: none
    if (document.body.classList.contains(darkModeClass)) {
        lyricsContainer.style.display = 'none';
    }
    
    // Добавляем обработчик animationend для установки display: none после исчезновения
        lyricsContainer.addEventListener('animationend', (e) => {
            // Проверяем, что анимация завершена для lyricsContainerDisappear
            if (e.animationName === 'lyricsContainerDisappear' && !lyricsContainer.classList.contains('visible')) {
                // В темной теме устанавливаем display: none после завершения анимации
                if (document.body.classList.contains(darkModeClass)) {
                    lyricsContainer.style.display = 'none';
                }
            }
        });

    try {
        const response = await fetch('music.mp3');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const metadata = await musicMetadata.parseBlob(blob);

        document.getElementById('song-title').textContent = metadata.common.title || "Неизвестный трек";
        document.getElementById('song-artist').textContent = metadata.common.artist || "Неизвестный исполнитель";

        if (metadata.common.picture?.length) {
            const picture = metadata.common.picture[0];
            const base64String = arrayBufferToBase64(picture.data);
            document.getElementById('album-art').src = `data:${picture.format};base64,${base64String}`;
        }

        if (metadata.format.duration) {
            document.getElementById('duration').textContent = formatTime(metadata.format.duration);
        }

        // Сброс прогресс бара при загрузке
        progressBar.style.width = '0%';
        currentTimeEl.textContent = '0:00';
    } catch (err) {
        console.error("Ошибка при чтении метаданных:", err);
        document.getElementById('song-title').textContent = "Ошибка чтения тегов";
        document.getElementById('song-artist').textContent = "";
    }
    
    if (loadingAnimation) {
        loadingAnimation.style.animation = 'noteToLyrics 1s ease-in-out forwards';
    }
    
    // Инициализация состояния .links при загрузке страницы (аудио по умолчанию на паузе)
    const linksBlock = document.querySelector('.links');
    linksBlock.style.paddingTop = '75px';
});
