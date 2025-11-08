export class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 'none';
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        
        this.setupAudio();
    }

    setupAudio() {
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('loadedmetadata', () => {
            this.onMetadataLoaded && this.onMetadataLoaded();
        });
        this.audio.addEventListener('timeupdate', () => {
            this.onTimeUpdate && this.onTimeUpdate(this.audio.currentTime);
        });
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.onError && this.onError(e);
        });
    }

    setupAudioContext() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            const source = this.audioContext.createMediaElementSource(this.audio);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
        } catch (error) {
            console.error('Failed to setup audio context:', error);
        }
    }

    loadPlaylist(playlist) {
        this.playlist = playlist;
        if (playlist.length > 0) {
            this.loadTrack(0);
        }
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentIndex = index;
        const track = this.playlist[index];
        this.audio.src = track.file;
        this.audio.load();
        
        this.onTrackChange && this.onTrackChange(track, index);
    }

    play() {
        if (!this.audio.src) return;
        
        this.setupAudioContext();
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.isPlaying = true;
                    this.onPlayStateChange && this.onPlayStateChange(true);
                })
                .catch(error => {
                    console.error('Play failed:', error);
                    this.onError && this.onError(error);
                });
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.onPlayStateChange && this.onPlayStateChange(false);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    next() {
        if (this.isShuffle) {
            const nextIndex = Math.floor(Math.random() * this.playlist.length);
            this.loadTrack(nextIndex);
        } else {
            const nextIndex = (this.currentIndex + 1) % this.playlist.length;
            this.loadTrack(nextIndex);
        }
        
        if (this.isPlaying) {
            this.play();
        }
    }

    prev() {
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
        } else {
            const prevIndex = this.currentIndex - 1 < 0 
                ? this.playlist.length - 1 
                : this.currentIndex - 1;
            this.loadTrack(prevIndex);
            
            if (this.isPlaying) {
                this.play();
            }
        }
    }

    stop() {
        this.pause();
        this.audio.currentTime = 0;
    }

    seek(time) {
        this.audio.currentTime = time;
    }

    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        return this.isShuffle;
    }

    toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentModeIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
        return this.repeatMode;
    }

    handleTrackEnd() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 'all' || this.currentIndex < this.playlist.length - 1) {
            this.next();
        } else {
            this.isPlaying = false;
            this.onPlayStateChange && this.onPlayStateChange(false);
        }
    }

    getCurrentTrack() {
        return this.playlist[this.currentIndex] || null;
    }

    getCurrentTime() {
        return this.audio.currentTime;
    }

    getDuration() {
        return this.audio.duration || 0;
    }

    getAnalyserData() {
        if (this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);
            return this.dataArray;
        }
        return null;
    }
}
