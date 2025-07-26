# ADR-006: Vercel KV (Redis) for Data Storage

## Status
Accepted

## Context
The authentication system required persistent data storage for user accounts, sessions, and logging. We needed a database solution that would integrate well with Vercel's serverless architecture and provide the necessary performance characteristics.

## Decision
We chose Vercel KV (powered by Upstash Redis) as our primary data store with:
- Key-value storage for user profiles and sessions
- 30-day TTL (time-to-live) for user data
- Structured logging with list operations for audit trails
- Redis data structures (strings, sets, lists) for different use cases
- Environment-based connection management

## Consequences

### Positive
- **High Performance**: Sub-millisecond response times for key-value operations
- **Seamless Integration**: Native Vercel integration with zero configuration
- **Automatic Scaling**: Handles traffic spikes without manual intervention
- **Built-in TTL**: Automatic data expiration prevents storage bloat
- **Cost Effective**: Pay-per-request model aligns with serverless usage
- **Global Distribution**: Automatic replication across regions
- **Redis Compatibility**: Standard Redis commands and data structures

### Negative
- **Data Durability**: Temporary storage model (30-day expiration)
- **Limited Querying**: No complex queries or relationships like SQL databases
- **Vendor Lock-in**: Tight coupling with Vercel ecosystem
- **Memory Limitations**: Redis is in-memory, costlier for large datasets
- **No ACID Transactions**: Limited transaction support compared to RDBMS
- **Schema Flexibility**: No enforced data structure validation

### Trade-offs
- **Performance vs. Durability**: Chose speed over long-term data persistence
- **Simplicity vs. Functionality**: Key-value simplicity over complex querying
- **Cost vs. Features**: Lower operational cost but limited advanced database features
- **Speed vs. Data Safety**: Fast operations with temporary storage model

## Data Architecture

### User Storage Pattern
```
user:{email} → User profile JSON
user:id:{userId} → User profile by ID (duplicate for fast lookups)
users:index → Set of all registered emails
```

### Session Management
```
session:{userId}:{timestamp} → Session data with 7-day TTL
```

### Logging Structure
```
logs:registrations → List of registration events (FIFO, max 1000)
logs:logins → List of login events (FIFO, max 1000)
logs:failed_logins → List of failed login attempts (FIFO, max 1000)
logs:errors → List of error events (FIFO, max 1000)
```

## Data Lifecycle Management
- User profiles: 30-day TTL, extended on activity
- Sessions: 7-day TTL, matches JWT expiration
- Logs: FIFO lists trimmed to last 1000 entries
- Automatic cleanup prevents storage bloat

## Performance Characteristics
- Read operations: <1ms typical response time
- Write operations: <2ms typical response time
- Concurrent connections: Automatically scaled
- Data replication: Multi-region for reliability

## Security Considerations
- Connection strings stored as environment variables
- No sensitive data stored in plain text (passwords hashed)
- Access patterns logged for audit trails
- Redis AUTH and TLS encryption in transit

## Backup Strategy
- Temporary data model (intentional data expiration)
- Critical data (user profiles) have 30-day retention
- Logs are expendable and automatically rotated
- Export functionality could be added for data migration

## Monitoring and Alerting
- Connection health monitoring
- Error rate tracking through logs
- Performance metrics via Vercel dashboard
- Storage usage monitoring

## Future Constraints
Data operations must:
1. Design for temporary storage (30-day maximum)
2. Use appropriate TTL values for different data types
3. Implement graceful degradation if Redis unavailable
4. Consider memory efficiency in data structure choices
5. Avoid storing large binary data
6. Plan for data export if persistence requirements change

## Migration Path
If moving to persistent database:
- Export user data before TTL expiration
- Implement database abstraction layer
- Maintain Redis for caching layer
- Gradual migration with dual-write strategy