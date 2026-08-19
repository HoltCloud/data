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

### 2. 启用GitHub Pages
1. 进入仓库的Settings → Pages
2. 选择Source为"GitHub Actions"
3. 保存设置

### 3. 触发部署
- 推送代码到main分支会自动触发部署
- 或手动在Actions标签页运行工作流

### 4. 自定义域名（可选）
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

## 故障排除
1. 如果页面显示空白，检查浏览器控制台错误
2. 确保 base 路径正确配置为 `/data/`
3. 检查GitHub Actions日志了解构建错误
