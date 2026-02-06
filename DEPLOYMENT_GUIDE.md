     # 部署指南

## GitHub Pages 部署（完全免费）

GitHub Pages 是 GitHub 提供的免费静态网站托管服务，具有以下优势：
- **完全免费**：个人和组织账户均可免费使用
- **自定义域名**：支持绑定自己的域名
- **自动HTTPS**：自动提供SSL证书，支持HTTPS
- **CDN加速**：通过GitHub的全球CDN分发
- **自动部署**：通过GitHub Actions实现CI/CD
- **流量限制**：每月100GB带宽，每月10万次请求（对于大多数项目足够）

**免费套餐限制：**
- 仓库大小：1GB
- 带宽：每月100GB
- 构建时间：每月3000分钟（GitHub Actions）
- 对于绝大多数个人项目和小型商业项目完全足够


### 1. 设置GitHub仓库
1. 在GitHub上创建一个新的仓库（如果还没有）
2. 将本地仓库推送到GitHub：
   ```bash
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

### 2. 配置GitHub Secrets
在GitHub仓库设置中，添加以下Secrets：
- `VITE_SUPABASE_ANON_KEY`: 你的Supabase匿名密钥
- `VITE_SUPABASE_URL`: 你的Supabase URL

**如何获取这些值：**
1. 登录到您的Supabase项目仪表板
2. 进入Settings → API
3. 在"Project API keys"部分，您可以找到：
   - `URL`: 您的Supabase项目URL
   - `anon` / `public` key: 匿名密钥（用于客户端应用）

**您的当前值（来自.env文件）：**
- `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d2J6a2R2cGF0Y2N3cGJ5YWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NDMwOTcsImV4cCI6MjA1NzQxOTA5N30.9aNLnAqVlLmdUhd9Rd0D8B-tugik5vWwCdfwW-26oOU
- `VITE_SUPABASE_URL`: https://vtwbzkdvpatccwpbyaja.supabase.co

**注意：** 这些密钥已经存在于您的.env文件中，直接复制到GitHub Secrets即可。

### 3. 启用GitHub Pages
1. 进入仓库的Settings → Pages
2. 选择Source为"GitHub Actions"
3. 保存设置

### 4. 触发部署
- 推送代码到main分支会自动触发部署
- 或手动在Actions标签页运行工作流

### 5. 自定义域名（可选）
1. 在GitHub Pages设置中添加自定义域名
2. 在域名注册商处配置CNAME记录

## 本地测试
```bash
# 构建项目
npm run build

# 使用本地服务器测试
npx serve dist
# 或使用Python
python3 -m http.server 8080 --directory dist
```

## 部署URL
项目将部署到：`https://holtcloud.github.io/data/`

## 环境变量
确保以下环境变量在构建时可用：
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`

## 故障排除
1. 如果页面显示空白，检查浏览器控制台错误
2. 确保base路径正确配置为`/datatool/`
3. 检查GitHub Actions日志了解构建错误