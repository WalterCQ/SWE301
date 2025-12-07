# SWE301 Ubuntu 服务器部署指南

## 📋 部署环境要求

- Ubuntu 20.04 LTS 或更高版本
- Node.js 18+
- npm 8+
- (可选) Nginx 反向代理
- (可选) PM2 进程管理
- 域名或服务器 IP

---

## 🚀 完整部署步骤

### 第1步: 准备服务器环境

```bash
# 更新系统
sudo apt update
sudo apt upgrade -y

# 安装 Node.js 和 npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version  # 应显示 v18.x.x
npm --version   # 应显示 8.x.x 或更高

# 安装 Git
sudo apt install -y git

# 安装 PM2 (进程管理)
sudo npm install -g pm2

# 安装 Nginx (反向代理)
sudo apt install -y nginx
```

---

### 第2步: 克隆项目

```bash
# 进入 web 目录
cd /var/www
# 或使用其他目录: /home/username/projects

# 克隆仓库
sudo git clone https://github.com/WalterCQ/SWE301.git
cd SWE301

# 如果已经有旧版本，更新到最新
# sudo git pull origin main
```

---

### 第3步: 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

---

### 第4步: 构建前端

```bash
# 构建生产版本
npm run build

# 输出目录: dist/
ls -la dist/
```

---

### 第5步: 配置后端环境变量

```bash
# 创建 .env 文件 (在 server 目录)
cat > server/.env << 'EOF'
PORT=3000
JWT_SECRET=your_jwt_secret_key_change_this_to_random_string
NODE_ENV=production
RESEND_API_KEY=your_resend_api_key_or_test_key
EOF

# 更安全的做法：使用随机密钥
openssl rand -hex 32 > /tmp/jwt_secret.txt
cat > server/.env << EOF
PORT=3000
JWT_SECRET=$(cat /tmp/jwt_secret.txt)
NODE_ENV=production
RESEND_API_KEY=re_test
EOF
```

---

### 第6步: 启动后端服务 (使用 PM2)

```bash
# 在项目根目录创建 PM2 配置
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'swe301-backend',
    script: './server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 保存 PM2 配置（重启后自动启动）
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup -u $USER --hp $HOME
```

---

### 第7步: 配置 Nginx 反向代理

```bash
# 创建 Nginx 配置
sudo cat > /etc/nginx/sites-available/swe301 << 'EOF'
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your_domain.com;  # 改为你的域名或 IP

    # 重定向 HTTP 到 HTTPS (如有 SSL)
    # return 301 https://$server_name$request_uri;

    # 前端静态文件
    location / {
        root /var/www/SWE301/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 日志
    access_log /var/log/nginx/swe301_access.log;
    error_log /var/log/nginx/swe301_error.log;
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/swe301 /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx  # 开机自启

# 重新加载配置
sudo systemctl reload nginx
```

---

### 第8步: 配置 SSL 证书 (可选但推荐)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请免费证书 (Let's Encrypt)
sudo certbot --nginx -d your_domain.com

# 自动续期
sudo systemctl start certbot.timer
sudo systemctl enable certbot.timer

# 验证证书
sudo certbot certificates
```

---

### 第9步: 数据库初始化

```bash
# 后端会自动创建 SQLite 数据库
# 如需手动初始化，运行:
cd /var/www/SWE301/server
node -e "require('./index.js')"  # 按 Ctrl+C 停止

# 验证数据库
ls -la database.sqlite
```

---

### 第10步: 验证部署

```bash
# 检查后端是否运行
curl http://localhost:3000/

# 检查前端是否可访问
curl http://localhost/

# 检查 PM2 日志
pm2 logs swe301-backend

# 检查 Nginx 日志
sudo tail -f /var/log/nginx/swe301_access.log
```

---

## 📝 更新旧版本到最新

```bash
# 进入项目目录
cd /var/www/SWE301

# 拉取最新代码
sudo git pull origin main

# 重新安装依赖 (如有新依赖)
npm install
cd server && npm install && cd ..

# 重新构建前端
npm run build

# 重启后端服务
pm2 restart swe301-backend

# 重新加载 Nginx
sudo systemctl reload nginx

# 验证更新成功
curl http://localhost:3000/
```

---

## 🛠️ 常用命令速查表

### PM2 相关

```bash
# 查看所有进程
pm2 list

# 查看某个进程详情
pm2 show swe301-backend

# 查看实时日志
pm2 logs swe301-backend

# 重启服务
pm2 restart swe301-backend

# 停止服务
pm2 stop swe301-backend

# 启动服务
pm2 start ecosystem.config.js

# 删除进程
pm2 delete swe301-backend
```

### Nginx 相关

```bash
# 检查配置语法
sudo nginx -t

# 启动
sudo systemctl start nginx

# 停止
sudo systemctl stop nginx

# 重启
sudo systemctl restart nginx

# 重新加载配置
sudo systemctl reload nginx

# 查看状态
sudo systemctl status nginx

# 开机自启
sudo systemctl enable nginx

# 查看日志
sudo tail -f /var/log/nginx/swe301_access.log
sudo tail -f /var/log/nginx/swe301_error.log
```

### Git 相关

```bash
# 查看当前分支和状态
cd /var/www/SWE301
git status
git branch

# 拉取最新代码
git pull origin main

# 查看提交历史
git log --oneline -5

# 如果有冲突，强制更新
git fetch origin
git reset --hard origin/main
```

### 日志查看

```bash
# 后端日志
pm2 logs swe301-backend --lines 100

# Nginx 访问日志
sudo tail -n 50 /var/log/nginx/swe301_access.log

# Nginx 错误日志
sudo tail -n 50 /var/log/nginx/swe301_error.log

# 系统日志
sudo journalctl -u nginx -n 50
```

---

## 🔍 故障排查

### 后端无法启动

```bash
# 检查端口是否被占用
sudo lsof -i :3000

# 查看 PM2 日志
pm2 logs swe301-backend

# 手动启动查看错误
cd /var/www/SWE301/server
node index.js
```

### Nginx 无法访问

```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/swe301_error.log

# 检查防火墙
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 更新后出现问题

```bash
# 回到上一个版本
cd /var/www/SWE301
git log --oneline  # 查看历史
git revert HEAD    # 撤销最后一次提交
git pull origin main --force  # 强制拉取

# 重启服务
pm2 restart swe301-backend
sudo systemctl reload nginx
```

---

## 📊 服务器资源监控

```bash
# 实时监控
pm2 monit

# 查看进程 CPU 和内存使用
ps aux | grep node

# 查看系统资源
free -h      # 内存
df -h        # 磁盘
top -u $USER # 用户进程
```

---

## 🔐 安全建议

```bash
# 1. 更改文件权限
sudo chown -R $USER:$USER /var/www/SWE301
sudo chmod -R 755 /var/www/SWE301

# 2. 配置防火墙
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# 3. 隐藏 Nginx 版本信息
sudo sed -i 's/server_tokens on/server_tokens off/g' /etc/nginx/nginx.conf

# 4. 定期备份数据库
sudo cp /var/www/SWE301/server/database.sqlite /backup/database.sqlite.bak

# 5. 监控日志
sudo logrotate -f /etc/logrotate.conf
```

---

## ✅ 部署检查清单

- [ ] Node.js 和 npm 已安装
- [ ] 项目已克隆到 `/var/www/SWE301`
- [ ] 前后端依赖已安装
- [ ] 前端已构建 (dist 目录存在)
- [ ] 后端 .env 文件已配置
- [ ] PM2 已启动后端
- [ ] Nginx 已配置并启动
- [ ] 可访问 http://your_domain.com
- [ ] 可访问 http://your_domain.com/api
- [ ] 日志文件位置已确认
- [ ] SSL 证书已配置 (如需要)
- [ ] 定期更新计划已制定

---

## 📞 部署后的更新步骤 (简化版)

每次从 GitHub 更新时，只需运行:

```bash
cd /var/www/SWE301

# 拉取最新代码
sudo git pull origin main

# 安装新依赖 (如有)
npm install
cd server && npm install && cd ..

# 重新构建前端
npm run build

# 重启服务
pm2 restart swe301-backend
sudo systemctl reload nginx

# 验证
echo "检查后端..."
curl http://localhost:3000/
echo "检查前端..."
curl http://localhost/
```

---

## 🎯 快速开始 (所有命令一次性执行)

```bash
#!/bin/bash
set -e

echo "=== SWE301 Ubuntu 部署脚本 ==="

# 更新系统
echo "更新系统..."
sudo apt update && sudo apt upgrade -y

# 安装依赖
echo "安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# 安装 PM2
echo "安装 PM2..."
sudo npm install -g pm2

# 克隆项目
echo "克隆项目..."
cd /var/www
sudo git clone https://github.com/WalterCQ/SWE301.git
cd SWE301
sudo chown -R $USER:$USER .

# 安装依赖
echo "安装 npm 依赖..."
npm install
cd server && npm install && cd ..

# 构建前端
echo "构建前端..."
npm run build

# 配置 PM2
echo "启动后端服务..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'swe301-backend',
    script: './server/index.js',
    env: { NODE_ENV: 'production', PORT: 3000 }
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save

# 配置 Nginx
echo "配置 Nginx..."
sudo tee /etc/nginx/sites-available/swe301 > /dev/null << 'EOF'
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name _;

    location / {
        root /var/www/SWE301/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/swe301 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

echo "=== 部署完成! ==="
echo "访问: http://localhost (需要设置服务器 IP 或域名)"
echo "后端: http://localhost:3000"
```

保存为 `deploy.sh`，然后运行:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

**最后更新**: 2025-12-07
