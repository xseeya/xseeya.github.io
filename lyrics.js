// lyrics.js
const lyricsLine = document.getElementById('lyrics-line');
let lyricsData = [];

// Загружаем и парсим .lrc
async function loadLyrics(fileName) {
    try {
        const res = await fetch(fileName.replace(/\.\w+$/, '.lrc'));
        if (!res.ok) throw new Error('LRC not found');
        const text = await res.text();
        lyricsData = parseLRC(text);
        console.log('Lyrics loaded:', lyricsData);
    } catch (e) {
        console.warn('Lyrics not loaded:', e.message);
    }
}

// Парсер LRC в массив { time, text }
function parseLRC(lrcText) {
    // Паттерн как строка — не сломается при копировании
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

function syncLyrics(audioElement) {
    let lastLyric = '';

    audioElement.addEventListener('timeupdate', () => {
        if (!lyricsData.length) return;
        const current = audioElement.currentTime;
        const currentLyric = lyricsData
            .slice()
            .reverse()
            .find(l => current >= l.time);

        if (currentLyric && currentLyric.text !== lastLyric) {
            lastLyric = currentLyric.text || '♪';

            // Плавно скрываем
            lyricsLine.classList.add('fade-out');

            // Ждём окончания анимации скрытия, меняем текст и показываем
            setTimeout(() => {
                lyricsLine.textContent = lastLyric;
                lyricsLine.classList.remove('fade-out');
            }, 400); // 400 мс = время transition в CSS
        }
    });
}


// Запуск
const audioPlayer = document.getElementById('audio-player');
loadLyrics(audioPlayer.src);
syncLyrics(audioPlayer);

export { loadLyrics, syncLyrics };
