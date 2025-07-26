# ADR-008: Binance API Integration for Cryptocurrency Tickers

## Status
Accepted

## Context
The unconference website footer required live cryptocurrency data to enhance user engagement and demonstrate real-time API integration capabilities. We needed to choose a reliable, free cryptocurrency data provider with good documentation and WebSocket support.

## Decision
We integrated Binance public APIs for real-time cryptocurrency data with:
- WebSocket connection to `wss://stream.binance.com:9443` for live data
- REST API fallback to `https://api.binance.com/api/v3/ticker/24hr`
- Bitcoin (BTCUSDT) and Ethereum (ETHUSDT) price tickers
- 5-minute update intervals with continuous WebSocket streaming
- Automatic reconnection logic with exponential backoff

## Consequences

### Positive
- **Real-time Data**: WebSocket provides instant price updates
- **High Reliability**: Binance has excellent uptime and data quality
- **No API Keys Required**: Public endpoints with generous rate limits
- **Comprehensive Data**: 24hr price change, volume, and price information
- **Global Recognition**: Binance is a well-known, trusted exchange
- **Free Tier**: No cost for basic ticker data
- **Good Documentation**: Clear API documentation and examples

### Negative
- **Third-party Dependency**: Site functionality depends on external service
- **Rate Limiting**: Public API has usage limits (though generous)
- **Network Reliability**: WebSocket connections can be unstable
- **Data Accuracy**: Prices reflect Binance exchange only, not market average
- **Regulatory Risk**: Potential regulatory issues with crypto data display
- **Maintenance Overhead**: Connection management and error handling complexity

### Trade-offs
- **Real-time vs. Reliability**: Chose real-time data with connection complexity
- **Free vs. Guaranteed**: Used free tier instead of paid API with SLAs
- **Single Source vs. Aggregation**: One exchange data for simplicity
- **Features vs. Maintenance**: Rich features with ongoing connection management

## Technical Implementation

### WebSocket Connection
```javascript
const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/')
this.wsConnection = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`)
```

### Fallback Strategy
- Primary: WebSocket for real-time updates
- Secondary: REST API polling every 5 minutes
- Tertiary: Error state with last known values

### Data Processing
- Price formatting with proper decimal places
- Percentage change calculation and color coding
- Volume abbreviation (K, M, B notation)
- Timestamp tracking for update recency

### Error Handling
- Automatic reconnection with backoff strategy
- Network failure graceful degradation
- Connection status indicators for users
- Error logging for debugging

## Performance Considerations
- Single WebSocket connection for multiple symbols
- Efficient data updates without DOM thrashing
- Memory leak prevention with proper cleanup
- Mobile-optimized update frequencies

## User Experience
- Visual indicators for connection status (green/red dots)
- Smooth price update animations
- Color-coded price changes (green up, red down)
- Last update timestamp display
- Loading states during initial connection

## Risk Mitigation
- Connection retry logic (max 5 attempts)
- Fallback to REST API if WebSocket fails
- Error state display instead of broken functionality
- Graceful degradation if API unavailable

## Compliance Considerations
- No financial advice disclaimer needed (display only)
- Data is public and free to display
- No user financial data collection
- Transparent data source attribution

## Future Constraints
Cryptocurrency ticker changes must:
1. Maintain fallback strategy for reliability
2. Handle network failures gracefully
3. Respect API rate limits and terms of service
4. Include proper error states and user feedback
5. Consider mobile data usage implications
6. Document any new data sources or endpoints

## Alternative Considerations
- CoinGecko API: More coins but potentially less reliable
- CryptoCompare: Good aggregation but requires API key
- Multiple exchanges: Better price accuracy but increased complexity
- Cached data service: Better reliability but less real-time

## Monitoring Requirements
- WebSocket connection health
- API response time tracking
- Error rate monitoring
- User engagement with ticker data
- Mobile performance impact assessment