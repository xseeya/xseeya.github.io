import { AudioPlayer } from './audioPlayer.js';
import { LrcParser } from './lrcParser.js';

class MusicPlayerApp {
    constructor() {
        this.player = new AudioPlayer();
        this.lrcParser = new LrcParser();
        this.currentLyrics = null;
        
        this.initElements();
        this.initTheme();
        this.loadPlaylist();
        this.setupEventListeners();
        this.setupPlayerCallbacks();
        this.setupVisualizer();
    }

    initElements() {
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.progressBar = document.getElementById('progressBar');
        this.volumeBar = document.getElementById('volumeBar');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.trackTitle = document.getElementById('trackTitle');
        this.trackArtist = document.getElementById('trackArtist');
        this.playlistEl = document.getElementById('playlist');
        this.lyricsContent = document.getElementById('lyricsContent');
        this.themeToggle = document.getElementById('themeToggle');
        this.visualizerCanvas = document.getElementById('visualizerCanvas');
        this.visualizerCtx = this.visualizerCanvas.getContext('2d');
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    async loadPlaylist() {
        try {
            const response = await fetch('playlist.json');
            const playlist = await response.json();
            this.player.loadPlaylist(playlist);
            this.renderPlaylist(playlist);
        } catch (error) {
            console.error('Failed to load playlist:', error);
            this.showError('Не удалось загрузить плейлист');
        }
    }

    renderPlaylist(playlist) {
        this.playlistEl.innerHTML = '';
        
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-item';
            li.dataset.index = index;
            
            li.innerHTML = `
                <div class="playlist-item-title">${track.title}</div>
                <div class="playlist-item-artist">${track.artist}</div>
            `;
            
            li.addEventListener('click', () => {
                this.player.loadTrack(index);
                this.player.play();
            });
            
            this.playlistEl.appendChild(li);
        });
    }

    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.player.togglePlay());
        this.prevBtn.addEventListener('click', () => this.player.prev());
        this.nextBtn.addEventListener('click', () => this.player.next());
        
        this.shuffleBtn.addEventListener('click', () => {
            const isShuffle = this.player.toggleShuffle();
            this.shuffleBtn.classList.toggle('active', isShuffle);
        });
        
        this.repeatBtn.addEventListener('click', () => {
            const mode = this.player.toggleRepeat();
            this.updateRepeatButton(mode);
        });
        
        this.progressBar.addEventListener('input', (e) => {
            const time = (e.target.value / 100) * this.player.getDuration();
            this.player.seek(time);
        });
        
        this.volumeBar.addEventListener('input', (e) => {
            this.player.setVolume(e.target.value / 100);
        });
        
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.player.togglePlay();
            }
        });
    }

    setupPlayerCallbacks() {
        this.player.onTrackChange = (track, index) => {
            this.trackTitle.textContent = track.title;
            this.trackArtist.textContent = track.artist;
            this.updateActivePlaylistItem(index);
            this.loadLyrics(track.lyrics);
        };

        this.player.onPlayStateChange = (isPlaying) => {
            this.playBtn.classList.toggle('playing', isPlaying);
        };

        this.player.onMetadataLoaded = () => {
            const duration = this.player.getDuration();
            this.totalTimeEl.textContent = this.formatTime(duration);
            this.progressBar.value = 0;
        };

        this.player.onTimeUpdate = (currentTime) => {
            this.currentTimeEl.textContent = this.formatTime(currentTime);
            const duration = this.player.getDuration();
            if (duration > 0) {
                this.progressBar.value = (currentTime / duration) * 100;
            }
            this.updateLyrics(currentTime);
        };

        this.player.onError = (error) => {
            console.error('Player error:', error);
            this.showError('Ошибка воспроизведения');
        };
    }

    async loadLyrics(lyricsFile) {
        if (!lyricsFile) {
            this.lyricsContent.innerHTML = '<p class="no-lyrics">Текст недоступен</p>';
            this.currentLyrics = null;
            return;
        }

        try {
            const response = await fetch(lyricsFile);
            const lrcContent = await response.text();
            this.currentLyrics = this.lrcParser.parse(lrcContent);
            this.renderLyrics();
        } catch (error) {
            console.error('Failed to load lyrics:', error);
            this.lyricsContent.innerHTML = '<p class="no-lyrics">Не удалось загрузить текст</p>';
            this.currentLyrics = null;
        }
    }

    renderLyrics() {
        if (!this.currentLyrics || this.currentLyrics.length === 0) {
            this.lyricsContent.innerHTML = '<p class="no-lyrics">Текст недоступен</p>';
            return;
        }

        this.lyricsContent.innerHTML = '';
        
        this.currentLyrics.forEach((line, index) => {
            const div = document.createElement('div');
            div.className = 'lyric-line';
            div.textContent = line.text || '♪';
            div.dataset.index = index;
            div.dataset.time = line.time;
            
            div.addEventListener('click', () => {
                this.player.seek(line.time);
            });
            
            this.lyricsContent.appendChild(div);
        });
    }

    updateLyrics(currentTime) {
        if (!this.currentLyrics) return;

        const currentLine = this.lrcParser.getCurrentLine(currentTime);
        
        const lines = this.lyricsContent.querySelectorAll('.lyric-line');
        lines.forEach((line, index) => {
            if (currentLine && index === currentLine.index) {
                line.classList.add('active');
                line.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                line.classList.remove('active');
            }
        });
    }

    updateActivePlaylistItem(index) {
        const items = this.playlistEl.querySelectorAll('.playlist-item');
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    updateRepeatButton(mode) {
        this.repeatBtn.classList.toggle('active', mode !== 'none');
        
        if (mode === 'one') {
            this.repeatBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    <text x="12" y="16" font-size="8" text-anchor="middle" fill="currentColor">1</text>
                </svg>
            `;
        } else {
            this.repeatBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
            `;
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    setupVisualizer() {
        const resizeCanvas = () => {
            const container = this.visualizerCanvas.parentElement;
            this.visualizerCanvas.width = container.clientWidth;
            this.visualizerCanvas.height = container.clientHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        this.animateVisualizer();
    }

    animateVisualizer() {
        const draw = () => {
            requestAnimationFrame(draw);

            const data = this.player.getAnalyserData();
            
            if (!data) {
                this.drawDefaultVisualizer();
                return;
            }

            const { width, height } = this.visualizerCanvas;
            const barCount = 64;
            const barWidth = width / barCount;

            this.visualizerCtx.clearRect(0, 0, width, height);

            const theme = document.documentElement.getAttribute('data-theme');
            const gradient = this.visualizerCtx.createLinearGradient(0, 0, 0, height);
            
            if (theme === 'dark') {
                gradient.addColorStop(0, '#818cf8');
                gradient.addColorStop(1, '#a78bfa');
            } else {
                gradient.addColorStop(0, '#6366f1');
                gradient.addColorStop(1, '#8b5cf6');
            }

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor((i / barCount) * data.length);
                const barHeight = (data[dataIndex] / 255) * height;

                this.visualizerCtx.fillStyle = gradient;
                this.visualizerCtx.fillRect(
                    i * barWidth,
                    height - barHeight,
                    barWidth - 2,
                    barHeight
                );
            }
        };

        draw();
    }

    drawDefaultVisualizer() {
        const { width, height } = this.visualizerCanvas;
        const barCount = 64;
        const barWidth = width / barCount;

        this.visualizerCtx.clearRect(0, 0, width, height);

        const theme = document.documentElement.getAttribute('data-theme');
        this.visualizerCtx.fillStyle = theme === 'dark' ? '#3d3d3d' : '#e9ecef';

        for (let i = 0; i < barCount; i++) {
            const barHeight = 10 + Math.random() * 20;
            this.visualizerCtx.fillRect(
                i * barWidth,
                height - barHeight,
                barWidth - 2,
                barHeight
            );
        }
    }

    formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showError(message) {
        console.error(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayerApp();
});
