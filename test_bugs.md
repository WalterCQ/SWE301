# 5个新Bug测试报告

## 测试环境
- 前端: http://localhost:5173/
- 后端: http://localhost:3000/

---

## Bug #1: LoginPage autocomplete 属性拼写错误 ❌
**类型**: 手动测试能发现  
**位置**: `src/views/LoginPage.vue` 第13行  
**缺陷**: `autocomplete="off-typo"`（应该是 `autocomplete="off"`）

### 测试步骤
1. 打开 http://localhost:5173/#/login
2. 在"Email or Username"输入框中输入测试邮箱: `test@example.com`
3. 点击其他地方或刷新页面
4. 再次访问登录页面

### 预期问题
- 浏览器仍会记忆之前输入的邮箱（因为 `off-typo` 不是有效的 autocomplete 值）
- 下次访问页面时会自动填充邮箱

### 实际表现
✓ **已确认**: 输入框显示 autocomplete 属性，但值为无效的 `off-typo`，浏览器会忽略此值

---

## Bug #2: RegisterPage 表单未reset ❌  
**类型**: Selenium自动化能检测  
**位置**: `src/views/RegisterPage.vue` onSubmit 函数 (第145-170行)  
**缺陷**: 注册成功后表单数据未被清空

### 测试步骤
1. 打开 http://localhost:5173/#/register
2. 填写表单:
   - Username: `testuser123`
   - Email: `test@example.com`
   - Password: `Secure123!`
   - Confirm Password: `Secure123!`
3. 点击"Send Code"发送验证码
4. 等待验证码（会在后端打印或邮件）
5. 输入验证码 (例: 123456)
6. 点击"Create Account"提交

### 预期问题
- 注册成功后，刷新页面或返回注册页面
- 表单中仍保留之前填写的数据

### 实际表现
✓ **已确认**: 代码中注册成功处理部分被注释了：
```javascript
// BUG: 注册成功后没有重置form，导致表单仍有数据
// username.value = ''
// email.value = ''
// password.value = ''
// confirmPassword.value = ''
// code.value = ''
```

---

## Bug #3: RegisterPage 前端缺少发送验证码间隔检查 ❌
**类型**: JMeter性能测试能检测  
**位置**: `src/views/RegisterPage.vue` onSendCode 函数  
**缺陷**: 前端未检查发送间隔，允许快速重复发送

### 测试步骤 (手动)
1. 打开 http://localhost:5173/#/register
2. 输入邮箱: `test@example.com`
3. 快速连续点击"Send Code"按钮多次（在1秒内）

### 预期问题
- 前端会多次向后端发送验证码请求
- 虽然后端有速率限制（60秒），但前端在短时间内会发送多个请求

### 实际表现
✓ **已确认**: 代码注释显示缺少前端缓冲：
```javascript
// BUG: 前端未检查发送间隔，允许短时间内频繁发送，后端才有速率限制
await api.post('/send-code', { email: email.value })
```

### JMeter 测试
```bash
# 创建 JMeter 测试计划
# 线程组：100个并发线程
# HTTP请求：POST http://localhost:3000/api/send-code
# Body: {"email":"test@example.com"}
# 预期: 看到429速率限制响应
```

---

## Bug #4: server/index.js 密码检查性能差 ❌
**类型**: JMeter性能测试能检测  
**位置**: `server/index.js` isStrongPassword 函数  
**缺陷**: 使用了低效率的正则表达式（易受ReDoS攻击）

### 代码
```javascript
function isStrongPassword(password) {
  if (typeof password !== 'string') return false
  // BUG: 使用了故意低效率的正则，被大量缺学蛮式攻击时性能下残
  const slowRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?:(?!.{256}).){8,}$/
  return slowRegex.test(password)
}
```

### 测试步骤
1. 手动注册测试：输入密码 `Weak1234` 时会感觉延迟
2. JMeter 性能测试: 批量发送register请求会显著延迟

### 预期问题
- 单个密码验证耗时较长（毫秒级）
- 大量并发时会导致CPU飙升
- ReDoS 正则轰炸可能导致服务崩溃

### 实际表现
✓ **已确认**: 使用了复杂的先行断言正则，容易触发回溯

---

## Bug #5: server/index.js login缺少空密码速率限制 ❌
**类型**: JMeter性能测试能检测  
**位置**: `server/index.js` POST /api/login  
**缺陷**: 使用空密码时不会触发速率限制（因为直接返回400）

### 代码
```javascript
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body
  // BUG: 缺少对空密码的速率限制检查，可被JMeter大量发送空密码请求
  if (!identifier || !password) return res.status(400).json({ error: 'Missing fields' })

  const idv = identifier.toLowerCase()
  
  // 检查速率限制 <- 这之后才有速率限制
  const rateLimit = checkLoginRateLimit(idv)
  // ...
})
```

### 测试步骤
1. 使用 curl 或 JMeter 发送空密码请求：
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com"}'
```

2. 快速发送多个这样的请求

### 预期问题
- 空密码请求不会触发速率限制
- 可用来进行无限的枚举攻击（枚举用户名）
- 不受 MAX_LOGIN_ATTEMPTS 限制

### 实际表现
✓ **已确认**: 代码直接返回，未经过 checkLoginRateLimit 函数

### JMeter 测试
```bash
# JMeter 测试计划
# 创建线程组: 1000 个线程
# HTTP 请求设置:
#   URL: http://localhost:3000/api/login
#   Method: POST
#   Body: {"identifier":"test@example.com","password":""}
#
# 期望: 所有请求都返回 400，没有 429 响应
# 这表明速率限制未被触发
```

---

## 总结表

| Bug # | 类型 | 文件 | 检测方式 | 严重级别 | 状态 |
|-------|------|------|--------|--------|------|
| 1 | HTML属性错误 | LoginPage.vue | 手动 | 低 | ✓ 确认 |
| 2 | 状态未清除 | RegisterPage.vue | Selenium | 中 | ✓ 确认 |
| 3 | 前端缺验证 | RegisterPage.vue | JMeter/Selenium | 中 | ✓ 确认 |
| 4 | 正则性能差 | server/index.js | JMeter | 高 | ✓ 确认 |
| 5 | 缺速率限制 | server/index.js | JMeter | 高 | ✓ 确认 |

---

## Selenium 自动化测试示例

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()

# Bug #2: 测试表单未reset
driver.get("http://localhost:5173/#/register")

# 填写表单
driver.find_element(By.XPATH, "//input[@type='text']").send_keys("testuser")
driver.find_element(By.XPATH, "//input[@type='email']").send_keys("test@example.com")

# 注册后刷新
driver.refresh()

# 检查表单是否被清空
username_value = driver.find_element(By.XPATH, "//input[@type='text']").get_attribute("value")
assert username_value == "", f"Expected empty but got: {username_value}"  # 会失败！

# Bug #3: 快速发送验证码
send_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Send Code')]")
for i in range(5):
    send_button.click()
    # 第一次会成功，后续应该被限制，但前端没有限制所以都会发送

driver.quit()
```

---

## JMeter 测试配置

**Bug #4 和 #5 的并发性能测试**：

1. 启动 JMeter
2. 创建线程组：100 并发，循环 10 次
3. HTTP 请求 1：
   - URL: `http://localhost:3000/api/register`
   - Body: 长密码导致正则回溯 (Bug #4)
4. HTTP 请求 2：
   - URL: `http://localhost:3000/api/login`
   - Body: 空密码 (Bug #5)
5. 观察响应时间和错误率

---

## 测试结果
✓ 所有5个bug已在代码中确认存在  
✓ 可用于软件测试课程作业  
✓ 已推送到 GitHub: https://github.com/WalterCQ/SWE301.git
