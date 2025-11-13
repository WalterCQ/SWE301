const { Resend } = require('resend')

// 初始化 Resend 客户端
console.log('API Key loaded:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET')
const resend = new Resend(process.env.RESEND_API_KEY)

// 验证邮件配置
async function verifyEmailConfig() {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured')
      return false
    }
    
    // 测试发送一个简单的验证请求
    const { data } = await resend.domains.list()
    console.log('Resend is ready to send messages')
    return true
  } catch (error) {
    console.error('Resend configuration error:', error.message)
    return false
  }
}

// 邮件HTML模板
function verificationCodeTemplate(code) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; text-align: center;">SecureApp Verification Code</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">
          Your verification code is:
        </p>
        <p style="font-size: 32px; font-weight: bold; color: #007bff; margin: 10px 0; letter-spacing: 3px;">
          ${code}
        </p>
      </div>
      <p style="color: #666; text-align: center;">
        This code will expire in 5 minutes.<br>
        If you didn't request this code, please ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        This is an automated message from SecureApp. Please do not reply.
      </p>
    </div>
  `
}

// 发送验证码邮件
async function sendVerificationCode(email, code) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SecureApp <onboarding@resend.dev>',
      to: [email],
      subject: 'SecureApp - Verification Code',
      html: verificationCodeTemplate(code)
    })

    if (error) {
      console.error('Resend error:', error)
      return false
    }

    console.log(`Verification code sent to ${email}, ID: ${data.id}`)
    return true
  } catch (error) {
    console.error('Failed to send email:', error.message)
    return false
  }
}

module.exports = {
  verifyEmailConfig,
  sendVerificationCode
}
