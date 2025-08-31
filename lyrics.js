// Элементы DOM
const lyricsLine = document.getElementById('lyrics-line');
const lyricsContainer = document.querySelector('.lyrics-container');
const audioPlayer = document.getElementById('audio-player');

// Переменные состояния
let lyricsData = [];
let lastLyric = '';

// Изначально скрываем текст песни
lyricsContainer.classList.remove('visible');

// Функция для отображения анимации загрузки
function showLoadingAnimation() {
    const loading = document.createElement('div');
    loading.style.position = 'absolute';
    loading.style.top = '50%';
    loading.style.left = '50%';
    loading.style.transform = 'translate(-50%, -50%)';
    loading.style.fontSize = '48px';
    loading.style.fontWeight = 'bold';
    loading.style.color = 'white';
    loading.style.textAlign = 'center';
    loading.style.animation = 'rotate 2s linear infinite';

    const loadingAnimation = document.createElement('div');
    loadingAnimation.style.width = '60px';
    loadingAnimation.style.height = '60px';
    loadingAnimation.style.fontSize = '48px';
    loadingAnimation.style.color = 'var(--accent)';
    loadingAnimation.style.textAlign = 'center';
    loadingAnimation.style.lineHeight = '60px';
    loadingAnimation.style.animation = 'slide 2s ease-in-out infinite, fadeIn 1s ease-in-out';
    loadingAnimation.style.transition = 'opacity 0.5s ease';

    loading.appendChild(loadingAnimation);
    lyricsContainer.appendChild(loading);

    // Удалить анимацию загрузки при отображении первого текста
    const removeLoading = () => {
        if (loading.parentNode) {
            lyricsContainer.removeChild(loading);
        }
    };

    // Прослушивать отображение первого текста
    const checkFirstLyric = () => {
        if (lyricsLine.textContent && lyricsLine.textContent !== '') {
            removeLoading();
            audioPlayer.removeEventListener('timeupdate', checkFirstLyric);
        }
    };

    audioPlayer.addEventListener('timeupdate', checkFirstLyric);
}

// Функция для загрузки текста песни
async function loadLyrics(fileName) {
    try {
        const res = await fetch(fileName.replace(/\.\w+$/, '.lrc'));
        if (!res.ok) throw new Error('LRC not found');
        const text = await res.text();
        lyricsData = parseLRC(text);
    } catch (e) {
        console.warn('Lyrics not loaded:', e.message);
    }
}

// Функция для парсинга LRC файла
function parseLRC(lrcText) {
    const regex = new RegExp("\\[(\\d+):(\\d+(?:\\.\\d+)?)\\](.*)");
    return lrcText.split('\n').map(line => {
        const match = line.match(regex);
        if (match) {
            const min = parseInt(match[1], 10);
            const sec = parseFloat(match[2]);
            const time = min * 60 + sec;
            const text = match[3].trim();
            return { time, text };
        }
        return null;
    }).filter(Boolean);
}

// Функция для синхронизации текста с аудио
function syncLyrics(audioElement) {
    audioElement.addEventListener('timeupdate', () => {
        if (!lyricsData.length) return;
        const current = audioElement.currentTime;
        const currentLyric = lyricsData.slice().reverse().find(l => current >= l.time);
        
        // Определяем текст для отображения (может быть пустой строкой)
        const lyricText = currentLyric ? currentLyric.text : '';
        
        // Обновляем текст только если он изменился
        if (lyricText !== lastLyric) {
            lastLyric = lyricText;
            lyricsLine.classList.add('slide-out');
            
            setTimeout(() => {
                lyricsLine.textContent = lastLyric;
                lyricsLine.classList.remove('slide-out');
                lyricsLine.classList.add('slide-in');

                // Проверить, помещается ли текст в одну строку
                const isSingleLine = lyricsLine.scrollWidth <= lyricsLine.clientWidth;
                if (isSingleLine) {
                    lyricsContainer.classList.add('single-line');
                } else {
                    lyricsContainer.classList.remove('single-line');
                }
                
                // Удаляем класс slide-in после завершения анимации
                setTimeout(() => {
                    lyricsLine.classList.remove('slide-in');
                }, 500);
            }, 500);
        }
    });
}

// Обработчики событий
audioPlayer.addEventListener('play', () => {
    showLoadingAnimation();
});

// Загрузка и синхронизация текста
loadLyrics(audioPlayer.src);
syncLyrics(audioPlayer);

export { loadLyrics, syncLyrics };
