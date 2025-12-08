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

// BUG #4: Singleton/Data Leak Global Variable
let globalCurrentUser = null

// BUG #5: Deadlock Resources
class AsyncLock {
  constructor(name) {
    this.name = name
    this.queue = []
    this.isLocked = false
  }

  acquire() {
    return new Promise(resolve => {
      if (!this.isLocked) {
        this.isLocked = true
        resolve()
      } else {
        this.queue.push(resolve)
      }
    })
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      next()
    } else {
      this.isLocked = false
    }
  }
}
const lockA = new AsyncLock('A')
const lockB = new AsyncLock('B')

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

  // 如果达到最大尝试次数，锁定30分钟
  if (attempts.count > MAX_LOGIN_ATTEMPTS) {
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
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch {
    return null
  }
}

function isStrongPassword(password) {
  if (typeof password !== 'string') return false
  // FIX: Use O(n) complexity check
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
  console.log(`[DEBUG] /api/send-code called for ${email}`)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('[DEBUG] Invalid email format')
    return res.status(400).json({ error: 'Invalid email' })
  }

  const now = Date.now()
  db.get(`SELECT * FROM codes WHERE email = ?`, [email], async (err, row) => {
    if (row && now - row.sentAt < 60 * 1000) {
      return res.status(429).json({ error: 'Too many requests', retryAfter: Math.ceil((60 * 1000 - (now - row.sentAt)) / 1000) })
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
        if (err) {
          console.error('[DEBUG] DB Insert Error:', err.message)
          return res.status(500).json({ error: 'Failed to save verification code' })
        }
        console.log('[DEBUG] DB Insert Success')
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

  db.get(`SELECT * FROM codes WHERE email = ?`, [email], async (err, row) => {
    console.log('Code lookup:', { email, found: !!row, storedCode: row?.code, providedCode: code })

    // BUG #1: Verification Bypass (Commented out check)
    // if (!row || row.code !== code) return res.status(400).json({ error: 'Invalid verification code' })
    console.log('Skipping verification check (BUG #1 active)')

    if (!row) {
      console.log('Warning: No verification code row found in DB! Proceeding anyway (and risking crash on next line)...')
    }

    // Safety check just for debugging (in real bug, this might crash)
    if (row && Date.now() > row.expiresAt) return res.status(400).json({ error: 'Verification code expired' })

    // BUG #5: Deadlock Trigger
    // Randomly choose order: A->B or B->A to cause partial ordering deadlock under load
    const order = Math.random() > 0.5 ? [lockA, lockB] : [lockB, lockA]

    // Non-blocking attempt to simulate work, but if we await here we block this request
    // To trigger deadlock, we need to HOLD one and WAIT for another.
    console.log(`Trying to acquire ${order[0].name}...`)
    await order[0].acquire()
    console.log(`Acquired ${order[0].name}, doing work...`)

    // Simulate processing time where we hold the lock
    await new Promise(r => setTimeout(r, 100))

    console.log(`Trying to acquire ${order[1].name}...`)
    await order[1].acquire() // <--- potential deadlock here if cross-waiting
    console.log(`Acquired ${order[1].name}`)

    // Release (in finally block normally, but here we just do it)
    order[1].release()
    order[0].release()

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
  // BUG: 缺少对空密码的速率限制检查，可被JMeter大量发送空密码请求
  if (!identifier) return res.status(400).json({ error: 'Missing fields' })

  const idv = identifier.toLowerCase()

  // FIX: Check rate limit BEFORE password validation
  const rateLimit = checkLoginRateLimit(idv)
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: rateLimit.message,
      retryAfter: rateLimit.retryAfter
    })
  }

  if (!password) return res.status(400).json({ error: 'Missing fields' })

  db.get(`SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?`, [idv, idv], async (err, user) => {
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // 登录成功，清除失败记录
    clearLoginAttempts(idv)

    // BUG #4: Singleton/Data Leak
    // Store user info in global variable, wait, then read it back
    const { password: _pw, ...safeUser } = user
    globalCurrentUser = safeUser.username
    await new Promise(r => setTimeout(r, 300)) // Delay to allow other requests to overwrite

    const token = generateToken(user)
    // Return the global variable, potentially leakage!
    res.json({ user: { ...safeUser, username: globalCurrentUser }, token, message: `Welcome ${globalCurrentUser}` })
  })
})

app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token invalid or expired' })

  db.get(`SELECT id, username, email FROM users WHERE id = ? AND email = ?`, [payload.id, payload.email], (err, user) => {
    if (!user) return res.status(401).json({ error: 'Token invalid or expired' })
    res.json(user)
  })
})

app.post('/api/delete-account', (req, res) => {
  const auth = req.headers.authorization
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token invalid or expired' })

  // 只能删除自己的账号，不允许删除他人账号
  const emailToDelete = payload.email

  db.run(`DELETE FROM users WHERE email = ?`, [emailToDelete], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete account' })
    db.run(`DELETE FROM codes WHERE email = ?`, [emailToDelete])
    res.json({ message: 'Account deleted successfully' })
  })
})

app.listen(PORT, async () => {
  console.log(`Backend running at http://localhost:${PORT}`)

  // AUTO_RESTART Logic
  const restartDelay = parseInt(process.env.AUTO_RESTART_DELAY || '600000', 10) // Default 10 mins
  console.log(`Auto-restart watchdog enable: Server will restart in ${restartDelay / 1000} seconds.`)

  setTimeout(() => {
    console.log('Watchdog timer expired: Auto-restarting server to clear state...')
    process.exit(0)
  }, restartDelay)

  // 验证邮件配置
  const emailReady = await verifyEmailConfig()
  if (!emailReady) {
    console.warn('Warning: Email service is not configured properly. Verification codes will only be logged.')
  }
})

