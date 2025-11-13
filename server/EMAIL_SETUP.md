# 邮件服务配置指南 - Resend

## Resend 配置步骤

### 1. 注册 Resend 账户
1. 访问 [Resend 官网](https://resend.com/)
2. 点击 "Sign up" 注册账户
3. 验证邮箱地址

### 2. 获取 API Key
1. 登录 Resend 控制台
2. 点击 "Settings" → "API Keys"
3. 点击 "Create API Key"
4. 给 API Key 命名（如 "SecureApp"）
5. 复制生成的 API Key

### 3. 配置发送域名（可选）
使用免费域名：
- 默认使用 `onboarding@resend.dev`
- 每天最多发送 100 封邮件

或配置自定义域名：
1. 在 Resend 控制台点击 "Domains"
2. 点击 "Add Domain"
3. 输入你的域名（如 `secureapp.com`）
4. 按提示配置 DNS 记录

### 4. 更新 .env 文件
```env
# Resend Email Configuration
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=SecureApp <onboarding@resend.dev>
```

如果使用自定义域名：
```env
RESEND_FROM_EMAIL=SecureApp <noreply@yourdomain.com>
```

## Resend 免费计划限制
- **每月**: 3,000 封邮件
- **每天**: 最多 100 封邮件
- **域名**: 1 个域名
- **数据保留**: 1 天
- **支持**: 工单支持

## 测试邮件服务
启动服务器后，如果 Resend 配置正确，会看到：
```
Resend is ready to send messages
```

如果配置错误，会看到：
```
Resend configuration error: [具体错误信息]
Verification code generated (email service not configured, check console)
```

## 生产环境建议
1. **升级到付费计划**: 如果需要发送更多邮件
2. **配置自定义域名**: 提高邮件送达率和品牌形象
3. **监控邮件发送**: 在 Resend 控制台查看发送统计
4. **设置邮件模板**: 使用 Resend 的模板功能提高效率

## 故障排除

### 常见错误
1. **API Key 无效**: 检查 `.env` 文件中的 API Key 是否正确
2. **域名未验证**: 如果使用自定义域名，确保 DNS 记录配置正确
3. **超出发送限制**: 检查是否超过每日 100 封的限制

### 调试方法
1. 查看服务器控制台日志
2. 登录 Resend 控制台查看发送历史
3. 检查 API Key 权限设置
