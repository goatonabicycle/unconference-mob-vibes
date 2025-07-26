# Unconference Mob Vibes

A synthwave-themed unconference website featuring duck recipes, games, and live cryptocurrency tickers.

## Features

- 🌍 **Interactive World Map** - Discover duck recipes from different regions
- 🎮 **Duck Pong Game** - Play Pong with a duck emoji as the ball
- 🖼️ **Duck Gallery** - Beautiful duck photography collection
- 🔐 **User Authentication** - Register and login with Vercel serverless functions
- ₿ **Live Crypto Tickers** - Real-time Bitcoin and Ethereum prices via Binance API
- 🎨 **Synthwave Design** - Retro-futuristic aesthetic with 3D effects
- 📱 **Mobile Responsive** - Mobile-first design with hamburger navigation

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Three.js
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Vercel KV (Redis)
- **Authentication**: JWT tokens with bcryptjs
- **APIs**: Binance WebSocket API for crypto prices
- **Deployment**: Vercel

## API Endpoints

### POST /api/register
Register a new user with name, email, password validation.

### POST /api/login  
Login with email/password, returns JWT token and session.

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- CORS protection
- Session management
- Comprehensive logging

## Deployment

Deploy to Vercel with environment variables configured for KV Redis integration.

## Architecture Decision Records (ADRs)

This project uses ADRs to document important architectural and design decisions. All ADRs are located in `docs/adr/` and include:

- Design decisions (synthwave aesthetic, mobile-first approach, duck theme)
- Technical architecture (serverless functions, Redis storage, JWT auth)
- Implementation strategies (pure CSS, Three.js integration, Easter eggs)

### Checking ADR Compliance

Before making significant changes, run the ADR compliance checker:

```bash
npm run check-adr
```

This will validate that changes don't violate established architectural decisions.

### Key Architectural Principles

1. **Mobile-First Design** - All features must work on mobile devices first
2. **Synthwave Aesthetic** - Maintain purple/pink/cyan color palette and glow effects
3. **Duck Theme Consistency** - Integrate duck elements naturally throughout
4. **Performance First** - Static delivery with dynamic enhancement
5. **Security Conscious** - JWT auth, input validation, comprehensive logging