import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'
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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
    }

    // Get user from Redis
    const userDataString = await redis.get(`user:${email.toLowerCase()}`)
    
    if (!userDataString) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const userData = JSON.parse(userDataString)

    // Check if user is active
    if (!userData.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password)
    
    if (!isPasswordValid) {
      // Log failed login attempt
      const failedLoginLog = {
        event: 'failed_login',
        email: email.toLowerCase(),
        timestamp: new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }
      
      await redis.lpush('logs:failed_logins', JSON.stringify(failedLoginLog))
      await redis.ltrim('logs:failed_logins', 0, 999)

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Update last login time
    userData.lastLogin = new Date().toISOString()
    
    // Update user data in Redis
    await redis.set(`user:${email.toLowerCase()}`, JSON.stringify(userData))
    await redis.set(`user:id:${userData.id}`, JSON.stringify(userData))
    
    // Extend expiration for active users (30 days)
    await redis.expire(`user:${email.toLowerCase()}`, 30 * 24 * 60 * 60)
    await redis.expire(`user:id:${userData.id}`, 30 * 24 * 60 * 60)

    // Generate JWT token
    const tokenPayload = {
      userId: userData.id,
      email: userData.email,
      name: userData.name
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: '7d' // Token expires in 7 days
    })

    // Log successful login
    const loginLog = {
      event: 'successful_login',
      userId: userData.id,
      email: userData.email,
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
    
    await redis.lpush('logs:logins', JSON.stringify(loginLog))
    await redis.ltrim('logs:logins', 0, 999)

    // Store session in Redis (optional - for session management)
    const sessionId = `session:${userData.id}:${Date.now()}`
    const sessionData = {
      userId: userData.id,
      email: userData.email,
      loginTime: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
    
    await redis.set(sessionId, JSON.stringify(sessionData))
    await redis.expire(sessionId, 7 * 24 * 60 * 60) // 7 days

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt
      },
      token: token,
      sessionId: sessionId
    })

  } catch (error) {
    console.error('Login error:', error)
    
    // Log error
    const errorLog = {
      event: 'login_error',
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
      message: 'Internal server error. Please try again later.'
    })
  }
}