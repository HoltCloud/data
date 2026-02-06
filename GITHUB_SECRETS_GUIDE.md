# GitHub Secrets 配置指南

## 步骤1：登录GitHub并进入仓库
1. 访问 https://github.com
2. 登录您的账户
3. 进入您的项目仓库（如果还没有，先创建一个）

## 步骤2：进入Secrets设置
1. 在仓库页面，点击顶部的 **"Settings"** 标签
2. 在左侧菜单中，找到 **"Secrets and variables"**
3. 点击 **"Actions"**

## 步骤3：添加Secrets
您需要添加以下两个Secrets：

### Secret 1: VITE_SUPABASE_ANON_KEY
1. 点击 **"New repository secret"** 按钮
2. 在 **"Name"** 字段输入：`VITE_SUPABASE_ANON_KEY`
3. 在 **"Secret"** 字段输入以下值：
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d2J6a2R2cGF0Y2N3cGJ5YWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NDMwOTcsImV4cCI6MjA1NzQxOTA5N30.9aNLnAqVlLmdUhd9Rd0D8B-tugik5vWwCdfwW-26oOU
   ```
4. 点击 **"Add secret"**

### Secret 2: VITE_SUPABASE_URL
1. 再次点击 **"New repository secret"** 按钮
2. 在 **"Name"** 字段输入：`VITE_SUPABASE_URL`
3. 在 **"Secret"** 字段输入以下值：
   ```
   https://vtwbzkdvpatccwpbyaja.supabase.co
   ```
4. 点击 **"Add secret"**

## 步骤4：验证Secrets
添加完成后，您应该在Secrets列表中看到：
- `VITE_SUPABASE_ANON_KEY` (已加密)
- `VITE_SUPABASE_URL` (已加密)

## 重要注意事项
1. **保密性**：Secrets的值在添加后会被加密，无法再次查看明文
2. **大小写敏感**：确保Secret名称完全匹配（包括大小写）
3. **使用时机**：这些Secrets会在GitHub Actions工作流运行时自动注入为环境变量
4. **本地开发**：本地开发时使用`.env`文件，部署时使用GitHub Secrets

## 如何获取这些值（如果需要重新获取）
1. **登录Supabase**：访问 https://app.supabase.com
2. **选择项目**：进入您的项目
3. **进入设置**：左侧菜单点击 **"Settings"** → **"API"**
4. **查找密钥**：
   - **Project URL**：在"Project URL"部分找到您的URL
   - **API Keys**：在"Project API keys"部分找到`anon` / `public` key

## 测试Secrets是否工作
1. 推送代码到GitHub仓库
2. 进入仓库的 **"Actions"** 标签页
3. 查看最新的工作流运行
4. 点击工作流查看详细日志
5. 在构建步骤中，环境变量应该被正确注入

## 常见问题
### Q: 如果Secret添加错误怎么办？
A: 可以删除错误的Secret，然后重新添加正确的。

### Q: Secrets在哪里使用？
A: 在`.github/workflows/deploy.yml`文件中，通过`${{ secrets.VITE_SUPABASE_ANON_KEY }}`引用。

### Q: 可以添加其他Secrets吗？
A: 可以，按照相同步骤添加任何需要的环境变量。

### Q: Secrets有大小限制吗？
A: 每个Secret最大64KB，足够存储大多数配置。