// Элементы DOM
const lyricsLine = document.getElementById('lyrics-line');
const lyricsContainer = document.querySelector('.lyrics-container');
const audioPlayer = document.getElementById('audio-player');

// Переменные состояния
let lyricsData = [];
let lastLyric = '';
let isSongStart = true; // Флаг для отслеживания начала песни
let wasPaused = false; // Флаг для отслеживания состояния паузы
let shouldShowLoadingAnimation = true; // Флаг для управления отображением анимации загрузки
let justResumed = false; // Флаг для отслеживания возобновления воспроизведения

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
        
        // При возобновлении после паузы показываем актуальный текст сразу без анимации
        if (justResumed) {
            // Обновляем текст немедленно без анимации
            lyricsLine.textContent = lyricText;
            lastLyric = lyricText;
            
            // Проверить, помещается ли текст в одну строку
            const isSingleLine = lyricsLine.scrollWidth <= lyricsLine.clientWidth;
            if (isSingleLine) {
                lyricsContainer.classList.add('single-line');
            } else {
                lyricsContainer.classList.remove('single-line');
            }
            
            // Сбрасываем флаг justResumed после первого обновления
            justResumed = false;
            
            // Продолжаем выполнение основной логики обновления текста
            // Проверяем, изменился ли текст или это начало песни
            if (lyricText === lastLyric && !isSongStart) {
                // Текст не изменился и это не начало песни, выходим
                return;
            }
        }
        
        // Обновляем текст только если он изменился
        if (lyricText !== lastLyric || isSongStart) {
            lastLyric = lyricText;
            // Проверяем, нужно ли показывать анимацию загрузки
            const showLoading = (lyricText === '' && shouldShowLoadingAnimation) || isSongStart;
            
            if (showLoading) {
                lyricsLine.classList.add('slide-out');
                
                setTimeout(() => {
                    // Отображаем анимацию "набора текста"
                    if (!lyricsLine.querySelector('.wave-loader')) {
                        lyricsLine.innerHTML = `
                            <div class="wave-loader">
                                <div class="wave-dot"></div>
                                <div class="wave-dot"></div>
                                <div class="wave-dot"></div>
                            </div>
                        `;
                    }
                    
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
                
                // Сбрасываем флаги после отображения анимации загрузки
                isSongStart = false;
                shouldShowLoadingAnimation = false;
            } else if (lyricText !== '') {
                // Показываем текст песни
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
            } else {
                // Если текст пустой и не нужно показывать анимацию загрузки, просто очищаем содержимое
                lyricsLine.textContent = '';
            }
        }
    });
}

// Обработчики событий
audioPlayer.addEventListener('play', () => {
    // Устанавливаем флаги для отображения анимации загрузки только если:
    // 1. Это новая песня (время воспроизведения близко к началу)
    // 2. Песня не была на паузе
    if (audioPlayer.currentTime < 0.1 && !wasPaused) {
        isSongStart = true;
        shouldShowLoadingAnimation = true;
        justResumed = false;
        // Показываем анимацию загрузки только при начале воспроизведения
        showLoadingAnimation();
    } else {
        // При возобновлении после паузы не показываем анимацию загрузки
        shouldShowLoadingAnimation = false;
        justResumed = true;
    }
    // Сбрасываем флаг паузы
    wasPaused = false;
});

// Отслеживание состояния паузы
audioPlayer.addEventListener('pause', () => {
    wasPaused = true;
});

// Сброс флага начала песни при завершении песни
audioPlayer.addEventListener('ended', () => {
    isSongStart = true;
});

// Загрузка и синхронизация текста
loadLyrics(audioPlayer.src);
syncLyrics(audioPlayer);

export { loadLyrics, syncLyrics };
