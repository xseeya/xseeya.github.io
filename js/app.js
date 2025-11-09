import { AudioPlayer } from './audioPlayer.js';
import { LrcParser } from './lrcParser.js';

class MusicPlayerApp {
    constructor() {
        this.player = new AudioPlayer();
        this.lrcParser = new LrcParser();
        this.currentLyrics = null;
        this.lyricsVisible = true;
        this.previousLyricsState = null;
        this.lastActiveIndex = -1;
        
        this.initElements();
        this.initTheme();
        this.initVolume();
        this.initLyricsVisibility();
        this.setupEventListeners();
        this.setupPlayerCallbacks();
        this.loadPlaylist();
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
        this.lyricsContent = document.getElementById('playerLyricsContent');
        this.lyricsContainer = document.getElementById('playerLyrics');
        this.lyricsToggle = document.getElementById('lyricsToggle');
        this.themeToggle = document.getElementById('themeToggle');
        
        this.lyricsContent.classList.add('paused');
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    initVolume() {
        const savedVolume = localStorage.getItem('volume');
        if (savedVolume !== null) {
            const volumeValue = parseFloat(savedVolume);
            this.volumeBar.value = volumeValue * 100;
            this.player.setVolume(volumeValue);
        } else {
            this.player.setVolume(0.7);
        }
    }

    initLyricsVisibility() {
        const lyricsVisible = localStorage.getItem('lyricsVisible');
        this.lyricsVisible = lyricsVisible === null ? true : lyricsVisible === 'true';
        this.updateLyricsVisibility();
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
            const volume = e.target.value / 100;
            this.player.setVolume(volume);
            localStorage.setItem('volume', volume);
        });
        
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        this.lyricsToggle.addEventListener('click', () => this.toggleLyrics());

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
            this.lyricsContent.classList.toggle('paused', !isPlaying);
        };

        this.player.onMetadataLoaded = () => {
            const duration = this.player.getDuration();
            this.totalTimeEl.textContent = this.formatTime(duration);
            this.progressBar.value = 0;
            this.progressBar.style.setProperty('--progress', '0%');
        };

        this.player.onTimeUpdate = (currentTime) => {
            this.currentTimeEl.textContent = this.formatTime(currentTime);
            const duration = this.player.getDuration();
            if (duration > 0) {
                const progress = (currentTime / duration) * 100;
                this.progressBar.value = progress;
                this.progressBar.style.setProperty('--progress', `${progress}%`);
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
            this.previousLyricsState = null;
            this.lastActiveIndex = -1;
            return;
        }

        try {
            const response = await fetch(lyricsFile);
            const lrcContent = await response.text();
            this.currentLyrics = this.lrcParser.parse(lrcContent);
            this.previousLyricsState = null;
            this.lastActiveIndex = -1;
            this.renderLyrics();
        } catch (error) {
            console.error('Failed to load lyrics:', error);
            this.lyricsContent.innerHTML = '<p class="no-lyrics">Не удалось загрузить текст</p>';
            this.currentLyrics = null;
            this.previousLyricsState = null;
            this.lastActiveIndex = -1;
        }
    }

    renderLyrics() {
        if (!this.currentLyrics || this.currentLyrics.length === 0) {
            this.lyricsContent.innerHTML = '<p class="no-lyrics">Текст недоступен</p>';
            return;
        }

        this.lyricsContent.innerHTML = '<p class="no-lyrics">♪ Воспроизведите трек ♪</p>';
    }

    updateLyrics(currentTime) {
        if (!this.currentLyrics || this.currentLyrics.length === 0) return;

        const currentLine = this.lrcParser.getCurrentLine(currentTime);
        
        if (!currentLine) {
            if (this.currentLyrics.length > 0) {
                const firstLineTime = this.currentLyrics[0].time;
                const timeUntilFirst = firstLineTime - currentTime;
                
                let newState;
                if (timeUntilFirst > 3) {
                    newState = 'dots';
                } else if (timeUntilFirst > 2) {
                    newState = 'countdown-3';
                } else if (timeUntilFirst > 1) {
                    newState = 'countdown-2';
                } else if (timeUntilFirst > 0) {
                    newState = 'countdown-1';
                } else {
                    newState = 'first-line';
                }
                
                if (this.previousLyricsState !== newState) {
                    this.previousLyricsState = newState;
                    
                    if (newState === 'dots') {
                        this.lyricsContent.innerHTML = '<div class="no-lyrics"><div class="pulsing-dots"><span></span><span></span><span></span></div></div>';
                    } else if (newState === 'countdown-3') {
                        this.lyricsContent.innerHTML = '<div class="no-lyrics"><div class="countdown">3</div></div>';
                    } else if (newState === 'countdown-2') {
                        this.lyricsContent.innerHTML = '<div class="no-lyrics"><div class="countdown">2</div></div>';
                    } else if (newState === 'countdown-1') {
                        this.lyricsContent.innerHTML = '<div class="no-lyrics"><div class="countdown">1</div></div>';
                    } else if (newState === 'first-line') {
                        const firstLine = this.currentLyrics[0];
                        this.lyricsContent.innerHTML = '';
                        const div = document.createElement('div');
                        div.className = 'lyric-line active';
                        div.textContent = firstLine.text || '♪';
                        div.dataset.index = 0;
                        div.dataset.time = firstLine.time;
                        div.addEventListener('click', () => {
                            this.player.seek(firstLine.time);
                        });
                        this.lyricsContent.appendChild(div);
                        this.lastActiveIndex = 0;
                    }
                }
            } else {
                if (this.previousLyricsState !== 'empty') {
                    this.previousLyricsState = 'empty';
                    this.lyricsContent.innerHTML = '<p class="no-lyrics">♪</p>';
                }
            }
            return;
        }

        const currentIndex = currentLine.index;
        const linesToShow = 3;
        const startIndex = Math.max(0, currentIndex - 1);
        const endIndex = Math.min(this.currentLyrics.length, currentIndex + linesToShow);

        const stateKey = `lyrics-${startIndex}-${endIndex}-${currentIndex}`;
        
        if (this.previousLyricsState !== stateKey) {
            this.previousLyricsState = stateKey;
            this.lyricsContent.innerHTML = '';
            
            for (let i = startIndex; i < endIndex; i++) {
                const line = this.currentLyrics[i];
                const div = document.createElement('div');
                div.className = 'lyric-line';
                div.textContent = line.text || '♪';
                div.dataset.index = i;
                div.dataset.time = line.time;
                
                if (i === currentIndex) {
                    div.classList.add('active');
                }
                
                div.addEventListener('click', () => {
                    this.player.seek(line.time);
                });
                
                this.lyricsContent.appendChild(div);
            }
            this.lastActiveIndex = currentIndex;
        } else if (currentIndex !== this.lastActiveIndex) {
            const lines = this.lyricsContent.querySelectorAll('.lyric-line');
            lines.forEach(line => {
                const index = parseInt(line.dataset.index);
                if (index === currentIndex) {
                    line.classList.add('active');
                } else {
                    line.classList.remove('active');
                }
            });
            this.lastActiveIndex = currentIndex;
        }
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

    toggleLyrics() {
        this.lyricsVisible = !this.lyricsVisible;
        this.updateLyricsVisibility();
        localStorage.setItem('lyricsVisible', this.lyricsVisible);
    }

    updateLyricsVisibility() {
        if (this.lyricsVisible) {
            this.lyricsContainer.classList.remove('hidden');
            this.lyricsToggle.classList.add('active');
            this.lyricsToggle.setAttribute('aria-label', 'Скрыть текст песни');
            this.lyricsToggle.title = 'Скрыть текст';
        } else {
            this.lyricsContainer.classList.add('hidden');
            this.lyricsToggle.classList.remove('active');
            this.lyricsToggle.setAttribute('aria-label', 'Показать текст песни');
            this.lyricsToggle.title = 'Показать текст';
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
