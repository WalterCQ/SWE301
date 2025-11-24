// index.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { sendVerificationCode, verifyEmailConfig } = require('./services/emailService')

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret'

const dbPath = path.resolve(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath)

// 登录失败记录
const loginAttempts = new Map()
const MAX_LOGIN_ATTEMPTS = 3

function checkLoginRateLimit(identifier) {
  const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 }
  const now = Date.now()
  
  // 如果距离上次尝试超过15分钟，重置计数
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return { allowed: true }
  }
  
  // 更新尝试次数
  attempts.count++
  attempts.lastAttempt = now
  loginAttempts.set(identifier, attempts)
  
  // 如果5次尝试失败，锁定30分钟
  if (attempts.count >= MAX_LOGIN_ATTEMPTS + 1) {
    const lockTime = 30 * 60 * 1000 // 30分钟
    return { 
      allowed: false, 
      retryAfter: Math.ceil(lockTime / 1000),
      message: 'Too many failed login attempts. Please try again later.'
    }
  }
  
  return { allowed: true }
}

function clearLoginAttempts(identifier) {
  loginAttempts.delete(identifier)
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS codes (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      sentAt INTEGER NOT NULL,
      expiresAt INTEGER NOT NULL
    )
  `)
})

app.use(cors())
app.use(express.json())

function generateId() {
  return 'uuid-' + Math.random().toString(36).slice(2, 10)
}

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })
}

function verifyToken(token) {
  try {
    if (!token) return null
    return jwt.decode(token)
  } catch {
    return null
  }
}

function isStrongPassword(password) {
  if (typeof password !== 'string') return false
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  )
}

app.get('/', (req, res) => res.send('Backend is running!'))

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

app.post('/api/send-code', async (req, res) => {
  const { email } = req.body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  
  const now = Date.now()
  db.get(`SELECT * FROM codes WHERE email = ?`, [email], async (err, row) => {
    if (row && now - row.sentAt < 60 * 1000) {
      return res.status(429).json({ error: 'Too many requests', retryAfter: Math.ceil((60*1000 - (now - row.sentAt))/1000) })
    }
    
    const code = generateVerificationCode()
    const sentAt = now
    const expiresAt = now + 5 * 60 * 1000
    
    // 尝试发送邮件
    try {
      const emailSent = await sendVerificationCode(email, code)
      if (!emailSent) {
        console.log(`Verification code for ${email}: ${code}`)
      }
    } catch (error) {
      console.log(`Email service failed, verification code for ${email}: ${code}`)
    }
    
    // 保存验证码到数据库
    db.run(`INSERT OR REPLACE INTO codes (email, code, sentAt, expiresAt) VALUES (?, ?, ?, ?)`,
      [email, code, sentAt, expiresAt], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save verification code' })
        return res.json({ message: 'Verification code sent' })
      })
  })
})

app.post('/api/register', (req, res) => {
  const { username, email, password, code } = req.body
  console.log('Register attempt:', { username, email, code })
  
  if (!username || !email || !password || !code) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  db.get(`SELECT * FROM codes WHERE email = ?`, [email], (err, row) => {
    console.log('Code lookup:', { email, found: !!row, storedCode: row?.code, providedCode: code })
    
    if (!row || row.code !== code) return res.status(400).json({ error: 'Invalid verification code' })
    if (Date.now() > row.expiresAt) return res.status(400).json({ error: 'Verification code expired' })

    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password too weak' })
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
      if (user) return res.status(409).json({ error: 'Email already exists' })

      const id = generateId()
      const hashed = bcrypt.hashSync(password, 10)
      db.run(`INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)`,
        [id, username, email, hashed], (err) => {
          if (err) return res.status(500).json({ error: 'Registration failed' })
          db.run(`DELETE FROM codes WHERE email = ?`, [email])
          res.json({ message: 'User created successfully' })
        })
    })
  })
})

app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body
  if (!identifier || !password) return res.status(400).json({ error: 'Missing fields' })

  const idv = identifier.toLowerCase()
  
  // 检查速率限制
  const rateLimit = checkLoginRateLimit(idv)
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      error: rateLimit.message,
      retryAfter: rateLimit.retryAfter 
    })
  }

  db.get(`SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?`, [idv, idv], (err, user) => {
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // 登录成功，清除失败记录
    clearLoginAttempts(idv)
    
    const { password: _pw, ...safeUser } = user
    const token = generateToken(user)
    res.json({ user: safeUser, token })
  })
})

app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token invalid or expired' })

  const SLOW_DELAY_MS = 1500
  setTimeout(() => {
    db.get(`SELECT id, username, email FROM users WHERE id = ? AND email = ?`, [payload.id, payload.email], (err, user) => {
      if (!user) return res.status(401).json({ error: 'Token invalid or expired' })
      res.json(user)
    })
  }, SLOW_DELAY_MS)
})

app.post('/api/delete-account', (req, res) => {
  const auth = req.headers.authorization
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token invalid or expired' })

  const { email: targetEmail } = req.body || {}
  const emailToDelete = targetEmail || payload.email

  db.run(`DELETE FROM users WHERE email = ?`, [emailToDelete], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete account' })
    db.run(`DELETE FROM codes WHERE email = ?`, [emailToDelete])
    res.json({ message: 'Account deleted successfully' })
  })
})

app.listen(PORT, async () => {
  console.log(`Backend running at http://localhost:${PORT}`)
  
  // 验证邮件配置
  const emailReady = await verifyEmailConfig()
  if (!emailReady) {
    console.warn('Warning: Email service is not configured properly. Verification codes will only be logged.')
  }
})

