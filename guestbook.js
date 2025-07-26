class GuestbookManager {
  constructor() {
    this.db = new PouchDB('unconference_guestbook');
    this.statsDb = new PouchDB('unconference_stats');
    this.selectedMood = '😊';
    this.entriesPerPage = 10;
    this.currentPage = 0;
    
    this.initializeGuestbook();
  }

  async initializeGuestbook() {
    try {
      // Track visitor
      await this.trackVisitor();
      
      // Load and display statistics
      await this.updateStatistics();
      
      // Load and display entries
      await this.loadEntries();
      
      // Set up form handlers
      this.setupFormHandlers();
      
      // Set up mood selector
      this.setupMoodSelector();
      
      // Initialize simple achievements
      this.initSimpleAchievements();
      
    } catch (error) {
      console.error('Failed to initialize guestbook:', error);
      this.showError('Failed to load guestbook. Please refresh the page.');
    }
  }

  async trackVisitor() {
    const today = new Date().toISOString().split('T')[0];
    const visitorKey = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Add visitor record
      await this.statsDb.put({
        _id: visitorKey,
        type: 'visitor',
        timestamp: new Date().toISOString(),
        date: today,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        language: navigator.language
      });
    } catch (error) {
      console.warn('Failed to track visitor:', error);
    }
  }

  async updateStatistics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all visitors
      const visitorsResult = await this.statsDb.allDocs({
        include_docs: true,
        startkey: 'visitor_',
        endkey: 'visitor_\uffff'
      });
      
      const totalVisitors = visitorsResult.rows.length;
      const visitorsToday = visitorsResult.rows.filter(row => 
        row.doc.date === today
      ).length;
      
      // Get all guestbook entries
      const entriesResult = await this.db.allDocs({
        include_docs: true
      });
      
      const totalEntries = entriesResult.rows.length;
      const entriesToday = entriesResult.rows.filter(row => 
        row.doc.date === today
      ).length;
      
      // Update UI
      document.getElementById('total-visitors').textContent = totalVisitors;
      document.getElementById('entries-today').textContent = entriesToday;
      document.getElementById('total-entries').textContent = totalEntries;
      
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  }

  setupMoodSelector() {
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    const moodInput = document.getElementById('visitor-mood');
    
    emojiButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove selected class from all buttons
        emojiButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to clicked button
        button.classList.add('selected');
        
        // Update selected mood
        this.selectedMood = button.dataset.emoji;
        moodInput.value = this.selectedMood;
      });
    });
    
    // Set default selection
    emojiButtons[0].classList.add('selected');
  }

  setupFormHandlers() {
    const form = document.getElementById('guestbook-form');
    const submitBtn = form.querySelector('.submit-btn');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      submitBtn.disabled = true;
      submitBtn.textContent = '✨ Adding Your Entry... ✨';
      
      try {
        await this.addGuestbookEntry(new FormData(form));
        form.reset();
        
        // Reset mood selector
        document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelector('.emoji-btn').classList.add('selected');
        this.selectedMood = '😊';
        document.getElementById('visitor-mood').value = '😊';
        
        // Show success message
        this.showSuccess('Thank you! Your entry has been added to the guestbook. 🎉');
        
        // Reload entries and stats
        await this.loadEntries();
        await this.updateStatistics();
        
      } catch (error) {
        console.error('Failed to add entry:', error);
        this.showError('Failed to add your entry. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🌟 Add My Entry to the Guestbook 🌟';
      }
    });
    
    // Character counter for message
    const messageTextarea = document.getElementById('visitor-message');
    const charCounter = document.createElement('div');
    charCounter.style.cssText = 'text-align: right; color: rgba(255,255,255,0.6); font-size: 0.8rem; margin-top: 0.5rem;';
    messageTextarea.parentNode.appendChild(charCounter);
    
    const updateCharCounter = () => {
      const remaining = 500 - messageTextarea.value.length;
      charCounter.textContent = `${remaining} characters remaining`;
      charCounter.style.color = remaining < 50 ? '#ff4444' : 'rgba(255,255,255,0.6)';
    };
    
    messageTextarea.addEventListener('input', updateCharCounter);
    updateCharCounter();
  }

  async addGuestbookEntry(formData) {
    const now = new Date();
    const entryId = `entry_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const entry = {
      _id: entryId,
      name: formData.get('name').trim(),
      location: formData.get('location').trim(),
      email: formData.get('email').trim(),
      website: formData.get('website').trim(),
      mood: this.selectedMood,
      message: formData.get('message').trim(),
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      ipHash: await this.generateVisitorHash(), // Simple visitor identification
      userAgent: navigator.userAgent.substring(0, 100) // Truncated for privacy
    };
    
    // Validate required fields
    if (!entry.name || !entry.message) {
      throw new Error('Name and message are required');
    }
    
    // Clean and validate website URL
    if (entry.website && !entry.website.startsWith('http')) {
      entry.website = 'https://' + entry.website;
    }
    
    await this.db.put(entry);
    return entry;
  }

  async generateVisitorHash() {
    // Simple hash for visitor identification (not for security)
    const data = navigator.userAgent + navigator.language + (navigator.platform || '');
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 12);
  }

  async loadEntries() {
    const container = document.getElementById('entries-container');
    
    try {
      const result = await this.db.allDocs({
        include_docs: true,
        descending: true // Most recent first
      });
      
      if (result.rows.length === 0) {
        container.innerHTML = `
          <div class="no-entries">
            <h3>🌟 Be the first to sign our guestbook! 🌟</h3>
            <p>No entries yet. Share your thoughts and become our first visitor!</p>
          </div>
        `;
        return;
      }
      
      const entries = result.rows.map(row => row.doc);
      this.renderEntries(entries, container);
      
    } catch (error) {
      console.error('Failed to load entries:', error);
      container.innerHTML = `
        <div class="loading" style="color: #ff4444;">
          ❌ Failed to load entries. Please refresh the page.
        </div>
      `;
    }
  }

  renderEntries(entries, container) {
    const entriesHtml = entries.map(entry => this.createEntryHtml(entry)).join('');
    container.innerHTML = entriesHtml;
  }

  createEntryHtml(entry) {
    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const timeAgo = this.getTimeAgo(date);
    const websiteLink = entry.website ? 
      `<a href="${this.sanitizeUrl(entry.website)}" target="_blank" rel="noopener noreferrer" style="color: #00ffff; text-decoration: none;">🌐 Visit Site</a>` : '';
    
    return `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-user">
            <span class="entry-avatar">${entry.mood}</span>
            <div>
              <div class="entry-name">${this.sanitizeHtml(entry.name)}</div>
              ${entry.location ? `<div class="entry-location">📍 ${this.sanitizeHtml(entry.location)}</div>` : ''}
            </div>
          </div>
          <div class="entry-date">${formattedDate}</div>
        </div>
        
        <div class="entry-message">${this.sanitizeHtml(entry.message)}</div>
        
        <div class="entry-footer">
          <div>${timeAgo}</div>
          <div>${websiteLink}</div>
        </div>
      </div>
    `;
  }

  sanitizeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:' ? url : '#';
    } catch {
      return '#';
    }
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'linear-gradient(45deg, #00ff88, #00aa55)' : 'linear-gradient(45deg, #ff4444, #cc0000)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 5px 25px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
      backdrop-filter: blur(10px);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    });
  }

  // Admin functions for managing the guestbook
  async clearAllEntries() {
    if (confirm('Are you sure you want to clear all guestbook entries? This cannot be undone.')) {
      try {
        const result = await this.db.allDocs();
        const deletePromises = result.rows.map(row => 
          this.db.remove(row.id, row.value.rev)
        );
        await Promise.all(deletePromises);
        await this.loadEntries();
        await this.updateStatistics();
        this.showSuccess('All entries have been cleared.');
      } catch (error) {
        console.error('Failed to clear entries:', error);
        this.showError('Failed to clear entries.');
      }
    }
  }

  async exportGuestbook() {
    try {
      const result = await this.db.allDocs({
        include_docs: true,
        descending: true
      });
      
      const entries = result.rows.map(row => row.doc);
      const dataStr = JSON.stringify(entries, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `unconference_guestbook_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      this.showSuccess('Guestbook exported successfully!');
    } catch (error) {
      console.error('Failed to export guestbook:', error);
      this.showError('Failed to export guestbook.');
    }
  }

  initSimpleAchievements() {
    // Track first visit
    const hasVisited = localStorage.getItem('duck_first_visit');
    if (!hasVisited) {
      localStorage.setItem('duck_first_visit', 'true');
      this.showAchievement('First Splash!', 'Welcome to the duck pond! 🦆', '🏊‍♂️');
    }

    // Track guestbook signature
    const form = document.getElementById('guestbook-form');
    if (form) {
      form.addEventListener('submit', () => {
        setTimeout(() => {
          this.showAchievement('Guestbook Quacker!', 'You signed the guestbook! 📝', '✍️');
        }, 1000);
      });
    }
  }

  showAchievement(title, description, icon) {
    const achievement = document.createElement('div');
    achievement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 2.5rem; animation: bounce 0.6s ease-in-out;">${icon}</div>
        <div>
          <div style="font-weight: bold; color: #00ffff; font-size: 1.1rem;">🏆 Achievement Unlocked!</div>
          <div style="color: white; font-size: 1rem; margin: 0.2rem 0;">${title}</div>
          <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">${description}</div>
        </div>
      </div>
    `;
    
    achievement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff006e 0%, #8b00ff 50%, #00ffff 100%);
      padding: 1.5rem;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(255, 0, 110, 0.6);
      z-index: 10000;
      max-width: 350px;
      animation: slideInBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      border: 2px solid rgba(255, 255, 255, 0.3);
    `;
    
    document.body.appendChild(achievement);
    
    // Add bounce animation
    const bounceStyle = document.createElement('style');
    bounceStyle.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-10px) scale(1.1); }
      }
      @keyframes slideInBounce {
        0% { transform: translateX(100%) scale(0.5); opacity: 0; }
        60% { transform: translateX(-10px) scale(1.05); opacity: 1; }
        100% { transform: translateX(0) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(bounceStyle);
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
      if (achievement.parentNode) {
        achievement.style.animation = 'slideInBounce 0.5s ease-out reverse';
        setTimeout(() => achievement.remove(), 500);
      }
    }, 6000);
    
    // Click to dismiss
    achievement.addEventListener('click', () => {
      achievement.style.animation = 'slideInBounce 0.5s ease-out reverse';
      setTimeout(() => achievement.remove(), 500);
    });
  }
}

// Initialize guestbook when DOM is loaded
let guestbookManager = null;

document.addEventListener('DOMContentLoaded', () => {
  guestbookManager = new GuestbookManager();
});

// Expose admin functions to console for debugging
window.guestbookAdmin = {
  clear: () => guestbookManager?.clearAllEntries(),
  export: () => guestbookManager?.exportGuestbook(),
  stats: async () => {
    if (!guestbookManager) return;
    
    const visitors = await guestbookManager.statsDb.allDocs({ include_docs: true });
    const entries = await guestbookManager.db.allDocs({ include_docs: true });
    
    console.log('Guestbook Statistics:', {
      totalVisitors: visitors.rows.length,
      totalEntries: entries.rows.length,
      visitors: visitors.rows.map(r => r.doc),
      entries: entries.rows.map(r => r.doc)
    });
  }
};