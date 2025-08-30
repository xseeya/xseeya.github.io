const lyricsLine = document.getElementById('lyrics-line');
let lyricsData = [];
const lyricsContainer = document.querySelector('.lyrics-container');

// Изначально скрываем текст песни
lyricsContainer.classList.remove('visible');

// Show loading animation before lyrics
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

    // Remove loading animation when first lyric is displayed
    const removeLoading = () => {
        if (loading.parentNode) {
            lyricsContainer.removeChild(loading);
        }
    };

    // Listen for the first lyric display
    const checkFirstLyric = () => {
        if (lyricsLine.textContent && lyricsLine.textContent !== '') {
            removeLoading();
            audioPlayer.removeEventListener('timeupdate', checkFirstLyric);
        }
    };

    audioPlayer.addEventListener('timeupdate', checkFirstLyric);
}

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

function syncLyrics(audioElement) {
    let lastLyric = '';
    audioElement.addEventListener('timeupdate', () => {
        if (!lyricsData.length) return;
        const current = audioElement.currentTime;
const currentLyric = lyricsData.slice().reverse().find(l => current >= l.time);
        if (currentLyric && currentLyric.text !== lastLyric) {
            lastLyric = currentLyric.text || '';
lyricsLine.classList.add('fade-out');
            setTimeout(() => {
                lyricsLine.textContent = lastLyric;
                lyricsLine.classList.remove('fade-out');
                lyricsLine.classList.add('fade-in');

                // Check if the lyric fits in one line
                const isSingleLine = lyricsLine.scrollWidth <= lyricsLine.clientWidth;
                if (isSingleLine) {
                    lyricsContainer.classList.add('single-line');
                } else {
                    lyricsContainer.classList.remove('single-line');
                }
            }, 400);
        }
    });
}

const audioPlayer = document.getElementById('audio-player');

// Show loading animation when audio starts
audioPlayer.addEventListener('play', () => {
    showLoadingAnimation();
});

loadLyrics(audioPlayer.src);
syncLyrics(audioPlayer);

export { loadLyrics, syncLyrics };
