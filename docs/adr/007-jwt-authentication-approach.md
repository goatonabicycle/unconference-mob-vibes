# ADR-007: JWT Authentication with localStorage

## Status
Accepted

## Context
The unconference website required user authentication for personalized features while maintaining the stateless nature of serverless architecture. We needed to balance security, user experience, and technical simplicity.

## Decision
We implemented JWT (JSON Web Token) authentication with:
- bcryptjs password hashing (12 salt rounds)
- JWT tokens with 7-day expiration
- Client-side token storage in localStorage
- Token validation endpoint for session verification
- Session tracking in Redis for audit and management

## Consequences

### Positive
- **Stateless Authentication**: Perfect fit for serverless architecture
- **Scalability**: No server-side session storage requirements
- **Performance**: Fast token validation without database lookups
- **Cross-Domain Support**: Tokens work across different domains/subdomains
- **Mobile Friendly**: Standard approach for SPAs and mobile apps
- **Offline Capability**: Tokens work without constant server connection

### Negative
- **XSS Vulnerability**: localStorage accessible to JavaScript, vulnerable to XSS attacks
- **Token Revocation**: Difficult to invalidate tokens before expiration
- **Storage Limitations**: localStorage limited to ~5-10MB per domain
- **No Automatic Cleanup**: Tokens persist even after browser closure
- **Manual Expiration Handling**: Client must handle token refresh logic
- **Security Trade-offs**: Less secure than httpOnly cookies for token storage

### Trade-offs
- **Convenience vs. Security**: Chose localStorage convenience over httpOnly cookie security
- **Stateless vs. Control**: Gained stateless benefits but lost immediate revocation capability
- **Simplicity vs. Security**: Simple implementation with known security limitations
- **Performance vs. Security**: Fast client-side validation with XSS exposure risk

## Security Implementation

### Password Security
- bcryptjs with 12 salt rounds
- Minimum 6-character password requirement
- Password confirmation validation
- No password storage in plain text

### Token Security
- HS256 algorithm for signing
- 7-day expiration to limit exposure window
- Payload includes user ID, email, name
- Environment variable for secret key

### Validation Strategy
- `/api/validate` endpoint for token verification
- User activity tracking on validation
- Automatic user data refresh on validation
- Session logging for audit trails

## Client-Side Implementation
```javascript
// Token storage
localStorage.setItem('userToken', token)
localStorage.setItem('userData', JSON.stringify(user))

// Authenticated requests
headers: { 'Authorization': `Bearer ${token}` }

// Automatic logout on 401 responses
if (response.status === 401) authManager.logout()
```

## Session Management
- JWT tokens stored in localStorage
- User data cached in localStorage
- Session records in Redis for tracking
- Automatic cleanup of expired sessions

## Error Handling
- Invalid token → automatic logout
- Expired token → redirect to login
- Network errors → graceful degradation
- Failed validation → session cleanup

## Security Mitigations
- HTTPS enforcement for token transmission
- Content Security Policy to reduce XSS risk
- Input validation and sanitization
- Error logging for security monitoring
- Rate limiting on authentication endpoints

## Future Security Considerations
- Consider httpOnly cookie implementation for enhanced security
- Implement token refresh mechanism
- Add device tracking for suspicious activity
- Consider multi-factor authentication
- Implement session revocation capability

## Quality Gates
Authentication changes must:
1. Maintain stateless design principles
2. Include proper error handling for all scenarios
3. Log security events appropriately
4. Validate all inputs thoroughly
5. Handle token expiration gracefully
6. Consider XSS and CSRF protection

## Potential Migration Path
To improve security:
1. Implement httpOnly cookie option
2. Add refresh token mechanism
3. Implement proper session revocation
4. Add device fingerprinting
5. Consider OAuth integration for external providers

## Monitoring Requirements
- Failed login attempt tracking
- Token validation frequency monitoring
- Session duration analysis
- Security event alerting
- Unusual access pattern detection