class EnhancedEffectsManager {
  constructor() {
    this.particles = [];
    this.duckCursor = null;
    this.achievementSystem = null;
    this.initialized = false;
    
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    // Enhanced particle system
    this.createParticleSystem();
    
    // Duck cursor trail
    this.createDuckCursorTrail();
    
    // Floating duck animations
    this.createFloatingDucks();
    
    // Enhanced hover effects
    this.addEnhancedHoverEffects();
    
    // Achievement system integration
    this.initAchievementSystem();
    
    // Progressive loading effects
    this.addProgressiveLoadingEffects();
    
    this.initialized = true;
  }

  createParticleSystem() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create duck-themed particles
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        emoji: ['🦆', '🐥', '🪶', '💫', '⭐'][Math.floor(Math.random() * 5)],
        size: Math.random() * 20 + 10,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 4,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      this.particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        
        // Wrap around screen
        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;
        
        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation * Math.PI / 180);
        ctx.font = `${particle.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.emoji, 0, 0);
        ctx.restore();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  createDuckCursorTrail() {
    const trail = [];
    let lastX = 0, lastY = 0;
    
    document.addEventListener('mousemove', (e) => {
      if (Math.abs(e.clientX - lastX) > 5 || Math.abs(e.clientY - lastY) > 5) {
        trail.push({
          x: e.clientX,
          y: e.clientY,
          time: Date.now(),
          id: Math.random()
        });
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        // Create trail element
        const trailElement = document.createElement('div');
        trailElement.innerHTML = '🦆';
        trailElement.style.cssText = `
          position: fixed;
          left: ${e.clientX - 10}px;
          top: ${e.clientY - 10}px;
          font-size: 20px;
          pointer-events: none;
          z-index: 9999;
          transition: all 1s ease-out;
          opacity: 0.8;
        `;
        document.body.appendChild(trailElement);
        
        // Animate and remove
        setTimeout(() => {
          trailElement.style.transform = 'scale(0) rotate(360deg)';
          trailElement.style.opacity = '0';
          setTimeout(() => trailElement.remove(), 1000);
        }, 100);
        
        // Limit trail length
        if (trail.length > 5) {
          trail.shift();
        }
      }
    });
  }

  createFloatingDucks() {
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every interval
        const duck = document.createElement('div');
        duck.innerHTML = ['🦆', '🐥', '🦢'][Math.floor(Math.random() * 3)];
        duck.style.cssText = `
          position: fixed;
          font-size: ${Math.random() * 30 + 20}px;
          left: ${Math.random() * window.innerWidth}px;
          top: ${window.innerHeight + 50}px;
          pointer-events: none;
          z-index: 5;
          transition: all 8s linear;
          transform: rotate(${Math.random() * 360}deg);
        `;
        document.body.appendChild(duck);
        
        // Animate upward
        setTimeout(() => {
          duck.style.top = '-100px';
          duck.style.transform += ` rotate(${Math.random() * 720}deg) scale(1.5)`;
          duck.style.opacity = '0';
        }, 100);
        
        // Remove after animation
        setTimeout(() => duck.remove(), 8000);
      }
    }, 3000);
  }

  addEnhancedHoverEffects() {
    // Enhanced button hover effects
    const style = document.createElement('style');
    style.textContent = `
      @keyframes duck-bounce {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-10px) scale(1.1); }
      }
      
      @keyframes rainbow-text {
        0% { color: #ff006e; }
        25% { color: #8b00ff; }
        50% { color: #00ffff; }
        75% { color: #00ff88; }
        100% { color: #ff006e; }
      }
      
      .enhanced-hover:hover {
        animation: duck-bounce 0.6s ease-in-out, rainbow-text 2s infinite;
        filter: drop-shadow(0 0 20px currentColor);
      }
      
      .feature-card:hover {
        transform: translateY(-15px) rotateY(5deg);
        filter: drop-shadow(0 20px 40px rgba(255, 0, 255, 0.5));
      }
      
      .gallery-item:hover {
        transform: translateY(-20px) scale(1.05) rotateZ(2deg);
      }
      
      .entry:hover {
        transform: translateX(10px);
        border-left: 5px solid #00ffff;
      }
    `;
    document.head.appendChild(style);
    
    // Add enhanced hover class to buttons
    document.querySelectorAll('button, .cta-button, .submit-btn').forEach(el => {
      el.classList.add('enhanced-hover');
    });
  }

  initAchievementSystem() {
    this.achievementSystem = new DuckAchievementSystem();
  }

  addProgressiveLoadingEffects() {
    // Add loading shimmer effects
    const shimmerStyle = document.createElement('style');
    shimmerStyle.textContent = `
      @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
      }
      
      .loading-shimmer {
        background: linear-gradient(90deg, transparent, rgba(255, 0, 255, 0.3), transparent);
        background-size: 200px 100%;
        animation: shimmer 1.5s infinite;
      }
      
      .page-transition {
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;
    document.head.appendChild(shimmerStyle);
    
    // Add page transition effects
    document.body.classList.add('page-transition');
  }

  // Easter egg: Konami code
  initKonamiCode() {
    const konamiCode = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'KeyB', 'KeyA'
    ];
    let currentSequence = [];
    
    document.addEventListener('keydown', (e) => {
      currentSequence.push(e.code);
      
      if (currentSequence.length > konamiCode.length) {
        currentSequence.shift();
      }
      
      if (currentSequence.join(',') === konamiCode.join(',')) {
        this.activateKonamiEasterEgg();
        currentSequence = [];
      }
    });
  }

  activateKonamiEasterEgg() {
    // Create massive duck explosion
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        const duck = document.createElement('div');
        duck.innerHTML = '🦆';
        duck.style.cssText = `
          position: fixed;
          font-size: ${Math.random() * 50 + 30}px;
          left: ${Math.random() * window.innerWidth}px;
          top: ${Math.random() * window.innerHeight}px;
          pointer-events: none;
          z-index: 10000;
          animation: duck-bounce 2s infinite;
        `;
        document.body.appendChild(duck);
        
        setTimeout(() => duck.remove(), 5000);
      }, i * 50);
    }
    
    // Show achievement
    if (this.achievementSystem) {
      this.achievementSystem.unlock('konami-quack');
    }
    
    // Play special sound effect (if possible)
    this.playDuckSound();
  }

  playDuckSound() {
    // Create a simple duck quack sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not available');
    }
  }
}

class DuckAchievementSystem {
  constructor() {
    this.achievements = {
      'first-visit': { name: 'First Splash', description: 'Welcome to the pond!', icon: '🏊' },
      'guestbook-signer': { name: 'Guestbook Quacker', description: 'Signed the guestbook', icon: '✍️' },
      'map-explorer': { name: 'Globe Waddler', description: 'Explored the world map', icon: '🌍' },
      'game-player': { name: 'Pong Paddle', description: 'Played duck pong', icon: '🏓' },
      'easter-egg-hunter': { name: 'Egg Hunter', description: 'Found the hidden easter egg', icon: '🥚' },
      'gallery-visitor': { name: 'Art Appreciator', description: 'Visited the duck gallery', icon: '🎨' },
      'music-lover': { name: 'Synthwave Fan', description: 'Used the audio controls', icon: '🎵' },
      'konami-quack': { name: 'Secret Quacker', description: 'Found the Konami code!', icon: '🎮' },
      'night-owl': { name: 'Night Owl', description: 'Visited during late hours', icon: '🦉' },
      'mobile-warrior': { name: 'Mobile Duck', description: 'Accessed from mobile', icon: '📱' }
    };
    
    this.unlockedAchievements = this.loadProgress();
    this.init();
  }

  init() {
    this.trackPageVisits();
    this.checkTimeBasedAchievements();
    this.checkDeviceBasedAchievements();
  }

  unlock(achievementId) {
    if (!this.unlockedAchievements.includes(achievementId) && this.achievements[achievementId]) {
      this.unlockedAchievements.push(achievementId);
      this.saveProgress();
      this.showAchievementNotification(this.achievements[achievementId]);
    }
  }

  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 2rem;">${achievement.icon}</div>
        <div>
          <div style="font-weight: bold; color: #00ffff;">Achievement Unlocked!</div>
          <div style="color: white;">${achievement.name}</div>
          <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">${achievement.description}</div>
        </div>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #ff006e, #8b00ff);
      padding: 1rem;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 10000;
      max-width: 300px;
      animation: slideInRight 0.5s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.5s ease-out reverse';
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  }

  trackPageVisits() {
    // Track which pages user has visited
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage === 'guestbook.html') {
      this.unlock('guestbook-signer');
    } else if (currentPage === 'world-map.html') {
      this.unlock('map-explorer');
    } else if (currentPage === 'duck-game.html') {
      this.unlock('game-player');
    } else if (currentPage === 'gallery.html') {
      this.unlock('gallery-visitor');
    }
  }

  checkTimeBasedAchievements() {
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      this.unlock('night-owl');
    }
  }

  checkDeviceBasedAchievements() {
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.unlock('mobile-warrior');
    }
  }

  saveProgress() {
    localStorage.setItem('duck_achievements', JSON.stringify(this.unlockedAchievements));
  }

  loadProgress() {
    const saved = localStorage.getItem('duck_achievements');
    return saved ? JSON.parse(saved) : [];
  }

  getProgress() {
    const total = Object.keys(this.achievements).length;
    const unlocked = this.unlockedAchievements.length;
    return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EnhancedEffectsManager();
});

// Add slide-in animation CSS
const animationStyle = document.createElement('style');
animationStyle.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(animationStyle);