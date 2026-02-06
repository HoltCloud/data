# 手动启用GitHub Pages指南

## 问题描述
GitHub Actions报错：
```
Error: Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions
```

## 解决方案

### 方案1：手动启用GitHub Pages（推荐）
1. 访问：`https://github.com/HoltCloud/data/settings/pages`
2. 在"Build and deployment"部分：
   - **Source**：选择 **"GitHub Actions"**
   - **Branch**：保持默认（main）
3. 点击 **"Save"**

### 方案2：等待自动启用
我已经更新了GitHub Actions工作流，添加了`enablement: true`参数，工作流会自动尝试启用Pages。但手动启用更可靠。

## 验证步骤

### 1. 检查Pages是否已启用
访问：`https://holtcloud.github.io/data/`
- 如果显示404，说明Pages尚未部署
- 如果显示页面，说明已成功

### 2. 检查GitHub Actions状态
访问：`https://github.com/HoltCloud/data/actions`
- 查看最新的工作流运行
- 点击查看详细日志

### 3. 检查Pages设置
访问：`https://github.com/HoltCloud/data/settings/pages`
应该显示：
- ✅ "Your site is live at https://holtcloud.github.io/data/"
- 或显示部署状态

## 如果仍然失败

### 步骤1：添加GitHub Secrets（必须先完成）
如果没有添加Secrets，构建会失败：
1. 访问：`https://github.com/HoltCloud/data/settings/secrets/actions`
2. 添加两个Secrets：
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_URL`

### 步骤2：手动触发工作流
1. 访问：`https://github.com/HoltCloud/data/actions`
2. 点击"Deploy to GitHub Pages"工作流
3. 点击"Run workflow"
4. 选择"main"分支
5. 点击"Run workflow"

### 步骤3：检查构建日志
在构建日志中查找：
- ✅ "Setup Pages"步骤应该成功
- ✅ "Upload artifact"步骤应该成功
- ✅ "Deploy to GitHub Pages"步骤应该成功

## 常见错误及解决

### 错误1：缺少环境变量
```
Error: VITE_SUPABASE_ANON_KEY is not defined
```
**解决**：添加GitHub Secrets

### 错误2：构建失败
```
npm ERR! missing script: build
```
**解决**：确保package.json中有build脚本

### 错误3：权限不足
```
Error: Permission denied
```
**解决**：确保工作流有正确的permissions配置

## 快速测试命令
```bash
# 本地测试构建
npm run build

# 检查构建输出
ls -la dist/

# 本地运行测试
npx serve dist -p 3000
```

## 完成标志
当以下条件满足时，表示部署成功：
1. GitHub Actions工作流显示绿色✅
2. 访问 `https://holtcloud.github.io/data/` 显示您的应用
3. GitHub Pages设置显示"Your site is live"

## 紧急联系方式
如果问题持续存在：
1. 检查GitHub Status：`https://www.githubstatus.com/`
2. 查看GitHub文档：`https://docs.github.com/en/pages`
3. 在仓库中创建Issue描述问题