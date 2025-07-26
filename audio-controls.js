class SynthwaveAudioPlayer {
  constructor() {
    this.audioContext = null;
    this.audioBuffer = null;
    this.source = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.3; // Start at 30% volume
    this.synthwaveTrack = null;
    
    this.initializeAudio();
  }

  async initializeAudio() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;
      
      // Generate synthwave audio
      await this.generateSynthwaveAudio();
      
      // Auto-play with user interaction check
      this.setupAutoPlay();
      
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  async generateSynthwaveAudio() {
    // Create a synthwave-style track using Web Audio API
    const sampleRate = this.audioContext.sampleRate;
    const duration = 120; // 2 minutes loop
    const bufferLength = sampleRate * duration;
    
    this.audioBuffer = this.audioContext.createBuffer(2, bufferLength, sampleRate);
    
    // Fill buffer with synthwave-style audio
    for (let channel = 0; channel < 2; channel++) {
      const channelData = this.audioBuffer.getChannelData(channel);
      
      for (let i = 0; i < bufferLength; i++) {
        const time = i / sampleRate;
        
        // Create layered synthwave sound
        const bass = Math.sin(2 * Math.PI * 60 * time) * 0.3;
        const synth1 = Math.sin(2 * Math.PI * 220 * time + Math.sin(2 * Math.PI * 4 * time)) * 0.2;
        const synth2 = Math.sin(2 * Math.PI * 330 * time + Math.sin(2 * Math.PI * 0.5 * time)) * 0.15;
        const pad = Math.sin(2 * Math.PI * 110 * time) * 0.1;
        
        // Add some reverb-like delay
        const delay = i > sampleRate * 0.1 ? channelData[i - Math.floor(sampleRate * 0.1)] * 0.2 : 0;
        
        // Combine all elements
        channelData[i] = (bass + synth1 + synth2 + pad + delay) * 0.3;
        
        // Apply envelope for smooth fading
        const fadeIn = Math.min(1, time / 5);
        const fadeOut = time > duration - 5 ? Math.max(0, (duration - time) / 5) : 1;
        channelData[i] *= fadeIn * fadeOut;
      }
    }
  }

  setupAutoPlay() {
    // Wait for user interaction before playing
    const startAudio = () => {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.play();
      document.removeEventListener('click', startAudio);
      document.removeEventListener('keydown', startAudio);
    };

    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
  }

  play() {
    if (!this.audioContext || !this.audioBuffer || this.isPlaying) return;

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.loop = true;
    this.source.connect(this.gainNode);
    
    this.source.start(0);
    this.isPlaying = true;
    
    this.updateUI();
  }

  pause() {
    if (this.source && this.isPlaying) {
      this.source.stop();
      this.source = null;
      this.isPlaying = false;
      this.updateUI();
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
    }
    this.updateUI();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
    }
    this.updateUI();
  }

  updateUI() {
    const toggleButtons = document.querySelectorAll('.audio-toggle');
    const volumeSliders = document.querySelectorAll('.volume-slider');
    const volumePercentages = document.querySelectorAll('.volume-percentage');
    const audioControls = document.querySelectorAll('.audio-controls');

    toggleButtons.forEach(button => {
      button.classList.remove('playing', 'muted');
      
      if (this.isMuted) {
        button.classList.add('muted');
        button.innerHTML = '🔇';
        button.title = 'Unmute synthwave music';
      } else if (this.isPlaying) {
        button.classList.add('playing');
        button.innerHTML = '🔊';
        button.title = 'Pause synthwave music';
      } else {
        button.innerHTML = '🔊';
        button.title = 'Play synthwave music';
      }
    });

    volumeSliders.forEach(slider => {
      slider.value = this.volume * 100;
      slider.style.setProperty('--volume-percent', `${this.volume * 100}%`);
    });

    volumePercentages.forEach(percentage => {
      percentage.textContent = `${Math.round(this.volume * 100)}%`;
    });

    audioControls.forEach(control => {
      if (this.audioContext && this.audioContext.state === 'running') {
        control.classList.remove('loading');
      } else {
        control.classList.add('loading');
      }
    });
  }

  getAudioInfo() {
    return {
      playing: this.isPlaying,
      volume: this.volume,
      muted: this.isMuted,
      track: 'Synthwave Ambient Loop'
    };
  }
}

// Global audio player instance
let synthwavePlayer = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  synthwavePlayer = new SynthwaveAudioPlayer();
  
  // Set up event listeners for all audio controls
  setupAudioControls();
});

function setupAudioControls() {
  // Toggle play/pause
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('audio-toggle')) {
      e.preventDefault();
      if (synthwavePlayer) {
        if (synthwavePlayer.isMuted) {
          synthwavePlayer.toggleMute();
        } else {
          synthwavePlayer.togglePlayPause();
        }
      }
    }
  });

  // Volume slider
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('volume-slider')) {
      const volume = parseFloat(e.target.value) / 100;
      if (synthwavePlayer) {
        synthwavePlayer.setVolume(volume);
      }
    }
  });

  // Right-click on toggle for mute
  document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('audio-toggle')) {
      e.preventDefault();
      if (synthwavePlayer) {
        synthwavePlayer.toggleMute();
      }
    }
  });
}

// Export for use in other scripts
window.synthwavePlayer = synthwavePlayer;