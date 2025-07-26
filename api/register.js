import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Initialize Redis client with Vercel KV
const redis = Redis.fromEnv()

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
    const { name, email, password, confirmPassword } = req.body

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
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

    // Check if user already exists
    const existingUser = await redis.get(`user:${email}`)
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user object
    const userId = uuidv4()
    const user = {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    }

    // Store user in Redis
    // Store with email as key for easy lookup
    await redis.set(`user:${email.toLowerCase()}`, JSON.stringify(user))
    
    // Also store by ID for future reference
    await redis.set(`user:id:${userId}`, JSON.stringify(user))
    
    // Add to users index for management
    await redis.sadd('users:index', email.toLowerCase())

    // Set expiration for temporary storage (30 days)
    await redis.expire(`user:${email.toLowerCase()}`, 30 * 24 * 60 * 60)
    await redis.expire(`user:id:${userId}`, 30 * 24 * 60 * 60)

    // Log registration event
    const logEntry = {
      event: 'user_registration',
      userId: userId,
      email: email.toLowerCase(),
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
    
    await redis.lpush('logs:registrations', JSON.stringify(logEntry))
    await redis.ltrim('logs:registrations', 0, 999) // Keep last 1000 registrations

    // Return success (don't include sensitive data)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    
    // Log error
    const errorLog = {
      event: 'registration_error',
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