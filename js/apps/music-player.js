// ================================================
// MUSIC PLAYER APP MODULE
// ================================================

export const MusicApp = {
    WindowManager: null,
    AchievementManager: null,
    audio: null,
    isPlaying: false,
    volume: 0.5,
    visualizerInterval: null,
    currentStation: 0,

    stations: [
        { name: 'Lofi Girl', url: 'https://boxradio-edge-00.streamafrica.net/lofi' },
        { name: 'Chillofi Radio', url: 'https://azc.rdstream-5677.dez.ovh/listen/chillofi/radio.mp3' },
        { name: 'Hunter.FM Lo-Fi', url: 'https://live.hunter.fm/lofi_normal' },
        { name: 'ISEKOI Chill Zone', url: 'https://public.isekoi-radio.com/listen/chill/radio.mp3' },
        { name: 'Nightwave Plaza', url: 'https://radio.plaza.one/mp3' }
    ],

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;

        // Register cleanup handler
        if (WindowManager) {
            WindowManager.registerCleanup('music', () => this.stop());
        }
    },

    open() {
        if (!this.WindowManager) return;

        const bars = Array(16).fill(0).map(() => '<div class="visualizer-bar" style="height: 4px;"></div>').join('');
        const stationOptions = this.stations.map((s, i) =>
            `<option value="${i}"${i === this.currentStation ? ' selected' : ''}>${s.name}</option>`
        ).join('');

        const content = `
            <div class="music-player">
                <div class="music-visualizer" id="music-visualizer">${bars}</div>
                <div class="music-station">
                    <select id="station-select" class="station-select">${stationOptions}</select>
                </div>
                <div class="music-info" id="music-status">Select station & press Play</div>
                <div class="music-controls">
                    <button class="music-btn" id="music-play-btn">Play</button>
                    <div class="volume-control">
                        <span>Vol:</span>
                        <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="50">
                    </div>
                </div>
            </div>
        `;

        const windowEl = this.WindowManager.createWindow('music', 'Lofi Radio', 320, 250, content);

        const playBtn = windowEl.querySelector('#music-play-btn');
        const volumeSlider = windowEl.querySelector('#volume-slider');
        const stationSelect = windowEl.querySelector('#station-select');

        playBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stop();
                playBtn.textContent = 'Play';
                playBtn.classList.remove('playing');
            } else {
                this.play();
                playBtn.textContent = 'Pause';
                playBtn.classList.add('playing');
            }
        });

        volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            if (this.audio) this.audio.volume = this.volume;
        });

        stationSelect.addEventListener('change', (e) => {
            this.currentStation = parseInt(e.target.value);
            if (this.isPlaying) {
                this.stop();
                this.play();
                playBtn.textContent = 'Pause';
                playBtn.classList.add('playing');
            }
        });

        // Track app usage
        if (this.AchievementManager) {
            this.AchievementManager.trackApp('music');
        }
    },

    play() {
        if (this.isPlaying) return;

        const station = this.stations[this.currentStation];
        const statusEl = document.getElementById('music-status');

        if (statusEl) statusEl.textContent = 'Connecting...';

        this.audio = new Audio(station.url);
        this.audio.volume = this.volume;
        this.audio.crossOrigin = 'anonymous';

        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;
            if (statusEl) statusEl.textContent = `Playing: ${station.name}`;

            // Track music lover achievement
            if (this.AchievementManager) {
                this.AchievementManager.check('music_lover');
            }
            this.startVisualizer();
        });

        this.audio.addEventListener('error', () => {
            if (statusEl) statusEl.textContent = 'Error - Try another station';
            this.stop();
            const playBtn = document.getElementById('music-play-btn');
            if (playBtn) {
                playBtn.textContent = 'Play';
                playBtn.classList.remove('playing');
            }
        });

        this.audio.addEventListener('waiting', () => {
            if (statusEl) statusEl.textContent = 'Buffering...';
        });

        this.audio.play().catch(() => {
            if (statusEl) statusEl.textContent = 'Error - Try another station';
        });
    },

    startVisualizer() {
        const bars = document.querySelectorAll('#music-visualizer .visualizer-bar');
        if (!bars.length) return;

        this.visualizerInterval = setInterval(() => {
            bars.forEach(bar => {
                bar.style.height = this.isPlaying ? `${Math.random() * 35 + 5}px` : '4px';
            });
        }, 100);
    },

    stop() {
        this.isPlaying = false;
        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
            this.visualizerInterval = null;
        }
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }
        const bars = document.querySelectorAll('#music-visualizer .visualizer-bar');
        bars.forEach(bar => bar.style.height = '4px');

        const statusEl = document.getElementById('music-status');
        if (statusEl) statusEl.textContent = 'Select station & press Play';
    }
};
