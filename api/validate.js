import { Redis } from '@upstash/redis'
import jwt from 'jsonwebtoken'

// Initialize Redis client with Vercel KV
const redis = Redis.fromEnv()

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'unconference-secret-key-change-in-production'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No valid authorization token provided'
      })
    }

    const token = authHeader.split(' ')[1]

    // Verify JWT token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      })
    }

    // Get user data from Redis
    const userDataString = await redis.get(`user:${decoded.email}`)
    
    if (!userDataString) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    const userData = JSON.parse(userDataString)

    // Check if user is still active
    if (!userData.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      })
    }

    // Update last activity
    userData.lastActivity = new Date().toISOString()
    
    // Update user data in Redis
    await redis.set(`user:${decoded.email}`, JSON.stringify(userData))
    await redis.set(`user:id:${userData.id}`, JSON.stringify(userData))
    
    // Extend expiration for active users (30 days)
    await redis.expire(`user:${decoded.email}`, 30 * 24 * 60 * 60)
    await redis.expire(`user:id:${userData.id}`, 30 * 24 * 60 * 60)

    // Return user data (without sensitive information)
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        lastLogin: userData.lastLogin,
        lastActivity: userData.lastActivity,
        createdAt: userData.createdAt
      },
      tokenInfo: {
        issuedAt: new Date(decoded.iat * 1000).toISOString(),
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      }
    })

  } catch (error) {
    console.error('Token validation error:', error)
    
    // Log error
    const errorLog = {
      event: 'token_validation_error',
      error: error.message,
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
    
    try {
      await redis.lpush('logs:errors', JSON.stringify(errorLog))
      await redis.ltrim('logs:errors', 0, 999)
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}