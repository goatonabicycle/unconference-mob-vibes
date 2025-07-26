// Binance API Integration for Crypto Tickers
class CryptoTicker {
  constructor() {
    this.wsConnection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.updateInterval = null;
    this.isConnected = false;
    
    this.symbols = ['BTCUSDT', 'ETHUSDT'];
    this.tickerData = {};
    
    this.init();
  }
  
  init() {
    this.createTickerElements();
    // Load prices immediately on startup
    this.fallbackToRestAPI();
    this.connectWebSocket();
    this.startPeriodicUpdates();
  }
  
  createTickerElements() {
    const tickerContainer = document.getElementById('crypto-tickers');
    if (!tickerContainer) return;
    
    tickerContainer.innerHTML = `
      <h3>
        Live Crypto Prices 
        <span class="api-status" id="api-status"></span>
        <span style="font-size: 0.8rem; font-weight: normal;">(30s updates)</span>
      </h3>
      <div class="ticker-grid">
        ${this.symbols.map(symbol => `
          <div class="ticker-item" id="ticker-${symbol.toLowerCase()}">
            <div class="ticker-symbol">${this.formatSymbol(symbol)}</div>
            <div class="ticker-price loading">Loading...</div>
            <div class="ticker-change">
              <span>24h Change: --</span>
            </div>
            <div class="ticker-volume">Volume: --</div>
          </div>
        `).join('')}
      </div>
      <div class="ticker-time" id="last-update">
        Last updated: --
      </div>
    `;
  }
  
  formatSymbol(symbol) {
    const symbolMap = {
      'BTCUSDT': '₿ Bitcoin (BTC)',
      'ETHUSDT': 'Ξ Ethereum (ETH)'
    };
    return symbolMap[symbol] || symbol;
  }
  
  connectWebSocket() {
    try {
      // Binance WebSocket for 24hr ticker statistics
      const streams = this.symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
      this.wsConnection = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);
      
      this.wsConnection.onopen = () => {
        console.log('Connected to Binance WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus(true);
      };
      
      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.updateTicker(data);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };
      
      this.wsConnection.onclose = () => {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.updateConnectionStatus(false);
        this.handleReconnect();
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.updateConnectionStatus(false);
      };
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.fallbackToRestAPI();
    }
  }
  
  updateTicker(data) {
    if (!data.s) return; // Skip if no symbol
    
    const symbol = data.s;
    const price = parseFloat(data.c);
    const change = parseFloat(data.P);
    const volume = parseFloat(data.v);
    
    this.tickerData[symbol] = {
      price: price,
      change: change,
      volume: volume,
      lastUpdate: new Date()
    };
    
    this.renderTicker(symbol, this.tickerData[symbol]);
  }
  
  renderTicker(symbol, data) {
    const tickerElement = document.getElementById(`ticker-${symbol.toLowerCase()}`);
    if (!tickerElement) return;
    
    const priceElement = tickerElement.querySelector('.ticker-price');
    const changeElement = tickerElement.querySelector('.ticker-change');
    const volumeElement = tickerElement.querySelector('.ticker-volume');
    
    // Update price with animation
    priceElement.textContent = `$${data.price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
    priceElement.classList.add('price-updated');
    setTimeout(() => priceElement.classList.remove('price-updated'), 500);
    
    // Update change with color coding
    const changePercent = data.change.toFixed(2);
    const changeIcon = data.change >= 0 ? '↗' : '↘';
    changeElement.innerHTML = `
      <span>${changeIcon} ${Math.abs(changePercent)}%</span>
    `;
    changeElement.className = `ticker-change ${data.change >= 0 ? 'positive' : 'negative'}`;
    
    // Update volume
    volumeElement.textContent = `Volume: ${this.formatVolume(data.volume)}`;
    
    // Update last update time
    this.updateLastUpdateTime();
  }
  
  formatVolume(volume) {
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
    return volume.toFixed(2);
  }
  
  updateLastUpdateTime() {
    const timeElement = document.getElementById('last-update');
    if (timeElement) {
      timeElement.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  }
  
  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('api-status');
    if (statusElement) {
      statusElement.className = `api-status ${connected ? 'connected' : 'disconnected'}`;
    }
  }
  
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached, falling back to REST API');
      this.fallbackToRestAPI();
    }
  }
  
  async fallbackToRestAPI() {
    console.log('Using REST API fallback');
    this.updateConnectionStatus(false);
    
    // Use REST API as fallback
    for (const symbol of this.symbols) {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        const data = await response.json();
        
        if (data.symbol) {
          this.updateTicker({
            s: data.symbol,
            c: data.lastPrice,
            P: data.priceChangePercent,
            v: data.volume
          });
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        this.showError(symbol);
      }
    }
  }
  
  showError(symbol) {
    const tickerElement = document.getElementById(`ticker-${symbol.toLowerCase()}`);
    if (tickerElement) {
      const priceElement = tickerElement.querySelector('.ticker-price');
      priceElement.innerHTML = '<span class="error">Error loading</span>';
    }
  }
  
  startPeriodicUpdates() {
    // Update every 30 seconds (30000ms) as backup
    this.updateInterval = setInterval(() => {
      if (!this.isConnected) {
        this.fallbackToRestAPI();
      }
    }, 30000); // 30 seconds
  }
  
  destroy() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize crypto ticker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if crypto ticker container exists
  if (document.getElementById('crypto-tickers')) {
    window.cryptoTicker = new CryptoTicker();
  }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (window.cryptoTicker) {
    window.cryptoTicker.destroy();
  }
});