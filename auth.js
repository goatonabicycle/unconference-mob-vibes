// Authentication utility functions
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('userToken');
    this.userData = JSON.parse(localStorage.getItem('userData') || 'null');
    this.sessionId = localStorage.getItem('sessionId');
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!(this.token && this.userData);
  }

  // Get current user data
  getCurrentUser() {
    return this.userData;
  }

  // Get auth token
  getToken() {
    return this.token;
  }

  // Update user data in localStorage
  updateUserData(userData) {
    this.userData = userData;
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Logout user
  logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('sessionId');
    this.token = null;
    this.userData = null;
    this.sessionId = null;
    
    // Redirect to login page
    window.location.href = 'login.html';
  }

  // Update navigation to show user info
  updateNavigation() {
    const loginLink = document.querySelector('nav a[href="login.html"]');
    if (loginLink && this.isLoggedIn()) {
      // Replace login link with user menu
      const userMenu = document.createElement('div');
      userMenu.className = 'user-menu';
      userMenu.innerHTML = `
        <span class="user-greeting">Hi, ${this.userData.name}!</span>
        <button onclick="authManager.logout()" class="logout-btn">Logout</button>
      `;
      
      // Add styles for user menu
      userMenu.style.cssText = `
        display: flex;
        align-items: center;
        gap: 1rem;
      `;
      
      const greetingSpan = userMenu.querySelector('.user-greeting');
      greetingSpan.style.cssText = `
        color: white;
        font-size: 0.9rem;
      `;
      
      const logoutBtn = userMenu.querySelector('.logout-btn');
      logoutBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: background 0.3s;
      `;
      
      // Replace the login link's parent li with user menu
      const loginLi = loginLink.parentElement;
      loginLi.innerHTML = '';
      loginLi.appendChild(userMenu);
    }
  }

  // Validate token with server (optional)
  async validateToken() {
    if (!this.token) return false;
    
    try {
      const response = await fetch('/api/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.updateUserData(data.user);
          return true;
        }
      }
      
      // Token is invalid, logout
      this.logout();
      return false;
      
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Make authenticated API requests
  async authenticatedFetch(url, options = {}) {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, { ...options, ...defaultOptions });
    
    // If unauthorized, logout
    if (response.status === 401) {
      this.logout();
      throw new Error('Authentication expired');
    }

    return response;
  }

  // Initialize auth manager
  init() {
    // Update navigation on page load
    document.addEventListener('DOMContentLoaded', () => {
      this.updateNavigation();
    });

    // If navigation is already loaded, update it
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.updateNavigation();
      });
    } else {
      this.updateNavigation();
    }
  }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Initialize auth manager
authManager.init();

// Utility functions for protected pages
function requireAuth() {
  if (!authManager.isLoggedIn()) {
    alert('Please log in to access this page.');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function showUserGreeting() {
  if (authManager.isLoggedIn()) {
    const user = authManager.getCurrentUser();
    const greeting = document.createElement('div');
    greeting.className = 'user-greeting-banner';
    greeting.innerHTML = `
      <p>Welcome back, <strong>${user.name}</strong>! 
      <span class="last-login">Last login: ${new Date(user.lastLogin || user.createdAt).toLocaleDateString()}</span></p>
    `;
    greeting.style.cssText = `
      background: rgba(0, 255, 136, 0.1);
      color: #00ff88;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 8px;
      text-align: center;
      border: 1px solid rgba(0, 255, 136, 0.3);
    `;
    
    const main = document.querySelector('main') || document.body;
    main.insertBefore(greeting, main.firstChild);
  }
}