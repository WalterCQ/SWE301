# 软件测试课程作业 - 5个Bug测试集

## 📝 项目概述

这是为SWE301软件测试课程准备的一个包含**精心设计的5个缺陷**的Web应用，用于教学和测试演练。

- **项目**: 用户认证系统 (SWE301)
- **代码库**: https://github.com/WalterCQ/SWE301.git
- **技术栈**: Vue 3 + Vite (前端) + Express.js (后端)
- **数据库**: SQLite
- **认证**: JWT

---

## 🐛 5个新增Bug详情

### 1️⃣ Bug #1: LoginPage HTML属性拼写错误

| 属性 | 内容 |
|------|------|
| **文件** | `src/views/LoginPage.vue` 第13行 |
| **类型** | 前端 - HTML属性错误 |
| **缺陷** | `autocomplete="off-typo"` (应为 "off") |
| **检测方式** | ✅ 手动测试 |
| **严重级别** | 🟡 低 |

**代码**:
```html
<input type="text" v-model.trim="email" @blur="validateEmail" 
       autocomplete="off-typo"  <!-- BUG: 拼写错误 -->
       class="w-full px-3 py-2 border rounded" />
```

**影响**: 浏览器会忽略无效的autocomplete值，继续自动填充用户凭证

---

### 2️⃣ Bug #2: RegisterPage 表单未reset

| 属性 | 内容 |
|------|------|
| **文件** | `src/views/RegisterPage.vue` 第147-161行 |
| **类型** | 前端 - 状态管理缺陷 |
| **缺陷** | 注册成功后表单数据未清空 |
| **检测方式** | ✅ Selenium自动化测试 |
| **严重级别** | 🟡 中 |

**代码**:
```javascript
async function onSubmit() {
  try {
    await auth.register({ ... })
    // BUG: 这些行被注释了，导致表单不清空
    // username.value = ''
    // email.value = ''
    // password.value = ''
    // confirmPassword.value = ''
    // code.value = ''
    
    successMessage.value = 'Account created successfully!'
    setTimeout(() => router.push('/login'), 1000)
  }
}
```

**Selenium测试脚本**:
```python
# 步骤1: 填写并提交表单
driver.find_element(By.NAME, "username").send_keys("testuser")
# ... 填写其他字段 ...

# 步骤2: 返回注册页面
driver.get("http://localhost:5173/#/register")

# 步骤3: 验证表单是否清空
username = driver.find_element(By.NAME, "username").get_attribute("value")
assert username == "", "表单未清空!"  # ❌ 会失败
```

**影响**: 用户数据重复、表单污染、用户体验差

---

### 3️⃣ Bug #3: 前端缺少验证码发送间隔检查

| 属性 | 内容 |
|------|------|
| **文件** | `src/views/RegisterPage.vue` 第189行 |
| **类型** | 前端 - 输入验证缺陷 |
| **缺陷** | 允许短时间内频繁发送验证码请求 |
| **检测方式** | ✅ JMeter并发测试 / Selenium |
| **严重级别** | 🟡 中 |

**代码**:
```javascript
async function onSendCode() {
  sendLoading.value = true
  try {
    // BUG: 前端未检查发送间隔，所有请求都会发送到后端
    await api.post('/send-code', { email: email.value })
    sendSuccess.value = true
    startCooldown(60)  // 这只是UI冷却，不阻止实际请求
  }
}
```

**JMeter测试配置**:
```
线程数: 50
循环: 10次
HTTP请求: POST http://localhost:3000/api/send-code
Body: {"email":"test@example.com"}

预期: 后端返回429限流错误
实际: 所有请求都到达后端(前端未限制)
```

**影响**: 后端负担增加、容易被用于DoS攻击

---

### 4️⃣ Bug #4: 密码校验正则表达式性能差

| 属性 | 内容 |
|------|------|
| **文件** | `server/index.js` 第94-100行 |
| **类型** | 后端 - 正则表达式ReDoS |
| **缺陷** | 使用易受回溯的复杂正则 |
| **检测方式** | ✅ JMeter性能测试 |
| **严重级别** | 🔴 高 |

**代码**:
```javascript
function isStrongPassword(password) {
  if (typeof password !== 'string') return false
  // BUG: 复杂的先行断言正则容易触发灾难性回溯
  const slowRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?:(?!.{256}).){8,}$/
  return slowRegex.test(password)
}
```

**正则问题分析**:
```
(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])
    ↓
   多个正向先行断言每个都遍历整个字符串
   当输入为长字符串或不匹配时，触发指数级回溯
```

**JMeter性能测试**:
```
并发: 50 线程
请求: POST /api/register
密码: "PasswordA1!Password...StringWith1000Chars"

响应时间:
  - 正常: <100ms
  - 此bug: >1000ms (达到秒级)
  
CPU使用率:
  - 正常: <30%
  - 此bug: 突增到>90%
```

**优化方案**:
```javascript
// 应改为 O(n) 复杂度
function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  )
}
```

**影响**: 服务性能下降、CPU飙升、可被用于DoS攻击

---

### 5️⃣ Bug #5: login 缺少空密码速率限制

| 属性 | 内容 |
|------|------|
| **文件** | `server/index.js` 第178-180行 |
| **类型** | 后端 - 安全漏洞 |
| **缺陷** | 空密码请求绕过速率限制 |
| **检测方式** | ✅ JMeter并发测试 |
| **严重级别** | 🔴 高 |

**代码**:
```javascript
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body
  
  // BUG: 这里直接返回，不经过速率限制检查
  if (!identifier || !password) 
    return res.status(400).json({ error: 'Missing fields' })
  
  const idv = identifier.toLowerCase()
  
  // 速率限制检查 <- 空密码请求永远到不了这里
  const rateLimit = checkLoginRateLimit(idv)
  // ...
})
```

**攻击场景 - 用户名枚举**:
```bash
# 攻击者可以快速枚举用户名，不受速率限制
for user in admin test guest user1 user2; do
  curl -s -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d "{\"identifier\":\"$user@example.com\",\"password\":\"\"}" &
done

# 结果: 所有请求都返回400，速率不受限
# 对比: 正常登录尝试在第4次就被限制为429
```

**JMeter测试脚本**:
```
测试名: 用户名枚举测试
并发: 500 线程
循环: 2次
参数化: 参数文件中的用户名列表

HTTP请求配置:
  URL: http://localhost:3000/api/login
  Method: POST
  Body: {"identifier":"${username}@example.com","password":""}

断言:
  - 响应码应为 429 (被限制)
  
实际结果: ❌ 所有响应码都是 400
  这意味着没有触发速率限制
```

**修复建议**:
```javascript
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body
  const idv = identifier.toLowerCase()
  
  // 应该在验证字段之前检查速率限制
  const rateLimit = checkLoginRateLimit(idv)
  if (!rateLimit.allowed) {
    return res.status(429).json({...})
  }
  
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  // ...
})
```

**影响**: 用户名枚举、暴力破解加速、安全风险

---

## 🧪 推荐测试方案

### 手动测试 (Bug #1)
```bash
1. 打开浏览器开发者工具 (F12)
2. 访问 http://localhost:5173/#/login
3. 在"Email or Username"输入框输入内容
4. 查看HTML源码中 autocomplete 属性值
5. 发现: autocomplete="off-typo" (拼写错误)
```

### Selenium自动化 (Bug #2, #3)
```python
from selenium import webdriver
from selenium.webdriver.common.by import By

driver = webdriver.Chrome()
driver.get("http://localhost:5173/#/register")

# Bug #2: 表单未reset
driver.find_element(By.NAME, "username").send_keys("testuser")
# ... 填写其他字段并提交 ...
driver.refresh()
username = driver.find_element(By.NAME, "username").get_attribute("value")
assert username == "", "Bug #2: 表单未清空!"

# Bug #3: 快速发送验证码
send_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Send')]")
for i in range(5):
    send_button.click()  # 快速点击5次
# 观察: 第1-2次成功，后续应该被限制(但因为前端缺少检查，可能都发送)
```

### JMeter性能测试 (Bug #4, #5)

**Bug #4 配置文件**:
```xml
<ThreadGroup guiclass="ThreadGroupGui">
  <elementProp name="threadData" ...>
    <stringProp name="ThreadGroup.num_threads">50</stringProp>
    <stringProp name="ThreadGroup.ramp_time">1</stringProp>
    <stringProp name="ThreadGroup.duration">60</stringProp>
  </elementProp>
</ThreadGroup>

<HTTPSamplerProxy guiclass="HttpTestSampleGui">
  <stringProp name="HTTPSampler.domain">localhost</stringProp>
  <stringProp name="HTTPSampler.port">3000</stringProp>
  <stringProp name="HTTPSampler.path">/api/register</stringProp>
  <stringProp name="HTTPSampler.method">POST</stringProp>
  <Arguments>
    <elementProp name="HTTPsampler.Arguments" ...>
      <stringProp name="Argument.value">{"password":"A1!Password...VeryLongString..."}</stringProp>
    </elementProp>
  </Arguments>
</HTTPSamplerProxy>

<ResultCollector guiclass="SummaryReport">
  <!-- 观察: 响应时间从 <100ms 变为 >1000ms -->
</ResultCollector>
```

**Bug #5 配置文件**:
```xml
<ThreadGroup>
  <stringProp name="ThreadGroup.num_threads">500</stringProp>
  <stringProp name="ThreadGroup.ramp_time">0</stringProp>
</ThreadGroup>

<HTTPSamplerProxy>
  <stringProp name="HTTPSampler.path">/api/login</stringProp>
  <stringProp name="HTTPSampler.method">POST</stringProp>
  <Arguments>
    <stringProp name="Argument.value">{"identifier":"test@example.com","password":""}</stringProp>
  </Arguments>
</HTTPSamplerProxy>

<ResponseAssertion guiclass="AssertionGui">
  <stringProp name="Assertion.test_type">2</stringProp>
  <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
  <stringProp name="Assertion.test_value">429</stringProp>
  <!-- 期望: 应该返回 429 (限流)
       实际: 都返回 400 (缺少限制)
  -->
</ResponseAssertion>
```

---

## 📊 Bug优先级与测试覆盖

| Bug | 优先级 | 功能影响 | 安全影响 | 性能影响 | 测试难度 | 建议课程 |
|-----|-------|--------|--------|--------|--------|--------|
| #1 | 低 | 中 | 低 | 无 | 易 | 基础测试 |
| #2 | 中 | 中 | 低 | 无 | 中 | 自动化测试 |
| #3 | 中 | 低 | 中 | 中 | 中 | 性能测试 |
| #4 | 高 | 低 | 低 | 高 | 难 | 性能/安全 |
| #5 | 高 | 低 | 高 | 低 | 中 | 安全测试 |

---

## 🚀 快速开始

### 环境需求
- Node.js v18+
- npm 8+
- 现代浏览器 (Chrome/Firefox)
- JMeter (可选，用于性能测试)

### 启动应用

**1. 克隆仓库**
```bash
git clone https://github.com/WalterCQ/SWE301.git
cd SWE301
```

**2. 安装依赖**
```bash
npm install              # 前端依赖
cd server && npm install # 后端依赖
```

**3. 启动后端**
```bash
cd server
RESEND_API_KEY=re_test node index.js
# 后端运行在 http://localhost:3000
```

**4. 启动前端**
```bash
npm run dev
# 前端运行在 http://localhost:5173
```

**5. 访问应用**
- 登录页: http://localhost:5173/#/login
- 注册页: http://localhost:5173/#/register
- 首页: http://localhost:5173/

---

## 📚 教学建议

### 课程设计

**第1周: 手动测试基础**
- 学习目标: 理解Bug #1
- 任务: 用浏览器开发者工具找出属性错误
- 评估: 能否识别HTML属性拼写问题

**第2周: 自动化测试入门**
- 学习目标: 理解Bug #2, #3
- 工具: Selenium WebDriver
- 任务: 编写脚本自动检测表单状态
- 评估: Selenium脚本能否正确验证bug

**第3-4周: 性能与安全测试**
- 学习目标: 理解Bug #4, #5
- 工具: JMeter
- 任务: 设计并发测试识别性能问题
- 评估: 能否通过数据证明安全漏洞存在

### 评分标准

**基础分 (每个bug)**
- 发现bug: 10分
- 写测试用例: 10分
- 验证bug存在: 10分
- 小计: 30分 × 5 = 150分

**加分项**
- 提出修复方案: +10分
- 编写自动化测试: +15分
- 性能分析报告: +20分

**满分: 200分**

---

## 📝 文件结构

```
SWE301/
├── src/
│   ├── views/
│   │   ├── LoginPage.vue        ← Bug #1 (autocomplete)
│   │   ├── RegisterPage.vue     ← Bug #2, #3 (表单reset, 发送间隔)
│   │   └── HomePage.vue
│   ├── components/
│   ├── store/
│   ├── router/
│   └── services/
├── server/
│   ├── index.js                 ← Bug #4, #5 (正则性能, 速率限制)
│   ├── db.js
│   └── services/
├── test_bugs.md                 ← 测试指南
├── TEST_RESULTS.md              ← 详细测试报告
└── README.md
```

---

## ✅ 验证清单

- [x] 5个bugs已在代码中添加
- [x] 代码已推送到GitHub
- [x] 编写了详细的测试文档
- [x] 提供了测试脚本示例
- [x] 手动测试已验证
- [x] 自动化测试框架已准备
- [x] JMeter测试配置已完成

---

## 📞 技术支持

- 代码仓库: https://github.com/WalterCQ/SWE301
- Bug报告: 在仓库中提Issue
- 测试资源: 详见 `test_bugs.md` 和 `TEST_RESULTS.md`

---

## 📄 许可证

MIT License - 可用于教学和学习

---

**最后更新**: 2025-12-07  
**作者**: 课程助教  
**版本**: 1.0
