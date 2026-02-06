# 项目更新和同步指南

## 完整工作流程
```
本地修改 → 提交到Git → 推送到GitHub → 自动部署 → 网站更新
```

## 步骤1：本地开发

### 1.1 启动开发服务器
```bash
# 在项目根目录运行
npm run dev
```
- 访问：`http://localhost:5173`
- 实时热重载：修改代码后自动刷新页面

### 1.2 进行修改
编辑任何项目文件：
- `src/App.tsx` - 主应用组件
- `src/` 目录下的其他文件
- `public/` 目录下的静态资源
- `index.html` - HTML模板

## 步骤2：本地测试

### 2.1 构建测试
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
# 或使用简单HTTP服务器
npx serve dist -p 3000
```

### 2.2 检查构建输出
```bash
# 查看构建文件
ls -la dist/

# 检查index.html中的资源路径
head -20 dist/index.html
```

## 步骤3：提交更改到Git

### 3.1 检查更改状态
```bash
# 查看哪些文件被修改
git status

# 查看具体修改内容
git diff
```

### 3.2 添加更改到暂存区
```bash
# 添加所有更改
git add .

# 或添加特定文件
git add src/App.tsx
git add package.json
```

### 3.3 提交更改
```bash
# 提交并添加描述
git commit -m "描述您的更改内容"

# 示例：
git commit -m "添加新功能：数据过滤"
git commit -m "修复样式问题"
git commit -m "更新依赖包"
```

## 步骤4：推送到GitHub

### 4.1 推送到远程仓库
```bash
# 推送到main分支
git push origin main

# 如果首次推送，使用：
git push -u origin main
```

### 4.2 查看推送状态
```bash
# 查看推送日志
git log --oneline -5

# 查看远程仓库状态
git remote -v
```

## 步骤5：触发自动部署

### 5.1 GitHub Actions自动触发
- 推送代码到main分支后，GitHub Actions会自动运行
- 工作流文件：`.github/workflows/deploy.yml`

### 5.2 手动触发部署（可选）
1. 访问：`https://github.com/HoltCloud/data/actions`
2. 点击"Deploy to GitHub Pages"工作流
3. 点击"Run workflow"
4. 选择"main"分支
5. 点击"Run workflow"

## 步骤6：监控部署状态

### 6.1 查看GitHub Actions状态
访问：`https://github.com/HoltCloud/data/actions`
- ✅ 绿色：部署成功
- ❌ 红色：部署失败（点击查看错误详情）

### 6.2 查看部署日志
在Actions页面：
1. 点击最新的工作流运行
2. 点击"deploy"作业
3. 查看各步骤日志

### 6.3 检查部署时间
部署通常需要：
- 构建：1-2分钟
- 部署：1-2分钟
- DNS缓存更新：5-30分钟

## 步骤7：验证网站更新

### 7.1 访问网站
```
https://holtcloud.github.io/data/
```

### 7.2 清除浏览器缓存
如果看不到更新：
- **Windows/Linux**：Ctrl + Shift + R
- **Mac**：Cmd + Shift + R
- 或打开开发者工具，禁用缓存刷新

### 7.3 检查版本
在网站中添加版本标识：
```javascript
// 在App.tsx中添加
console.log('版本：', process.env.VITE_APP_VERSION || '1.0.0');
```

## 高级工作流程

### 使用分支开发
```bash
# 创建新分支
git checkout -b feature/new-feature

# 在新分支上开发
# 提交更改
git add .
git commit -m "添加新功能"

# 切换回main分支
git checkout main

# 合并分支
git merge feature/new-feature

# 删除分支
git branch -d feature/new-feature
```

### 版本标签
```bash
# 创建版本标签
git tag v1.0.0

# 推送标签
git push origin v1.0.0
```

## 常见问题解决

### 问题1：构建失败
**症状**：GitHub Actions显示红色❌
**解决**：
1. 查看构建日志错误信息
2. 本地运行`npm run build`测试
3. 修复错误后重新提交

### 问题2：网站不更新
**症状**：代码已推送，但网站无变化
**解决**：
1. 检查GitHub Actions是否成功
2. 清除浏览器缓存
3. 等待DNS缓存更新

### 问题3：环境变量问题
**症状**：Supabase连接失败
**解决**：
1. 确保GitHub Secrets已正确配置
2. 本地测试使用`.env`文件
3. 重新触发部署

### 问题4：资源404错误
**症状**：控制台显示资源加载失败
**解决**：
1. 检查vite.config.ts中的base路径
2. 确保资源路径正确
3. 重新构建部署

## 自动化脚本

### 快速部署脚本
创建`deploy.sh`：
```bash
#!/bin/bash
echo "开始部署流程..."
npm run build
git add .
git commit -m "自动部署: $(date)"
git push origin main
echo "部署已触发，请查看GitHub Actions状态"
```

### 本地测试脚本
创建`test.sh`：
```bash
#!/bin/bash
echo "清理旧构建..."
rm -rf dist
echo "构建项目..."
npm run build
echo "启动测试服务器..."
npx serve dist -p 3000
```

## 最佳实践

### 1. **频繁提交**
- 小步提交，每次一个功能或修复
- 清晰的提交信息

### 2. **本地测试**
- 每次修改前本地测试
- 构建通过后再提交

### 3. **监控部署**
- 关注GitHub Actions状态
- 及时处理部署失败

### 4. **版本控制**
- 使用语义化版本
- 重要版本打标签

### 5. **文档更新**
- 更新README.md
- 记录重大变更

## 紧急回滚

### 回滚到上一个版本
```bash
# 查看提交历史
git log --oneline -10

# 回滚到指定提交
git revert <commit-hash>

# 或重置到指定提交
git reset --hard <commit-hash>
git push -f origin main  # 谨慎使用！
```

## 联系方式
- GitHub仓库：`https://github.com/HoltCloud/data`
- GitHub Issues：报告问题
- GitHub Actions：查看部署状态

记住：每次推送代码到main分支都会自动触发部署，确保网站始终与最新代码同步！