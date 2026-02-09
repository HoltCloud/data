# Git 同步指令 - 简洁版

## 🚀 快速同步（三步法）
```bash
# 1. 添加所有修改
git add .

# 2. 提交并描述修改
git commit -m "描述您的修改内容"

# 3. 推送到GitHub并自动部署
git push origin main
```

## 📋 详细步骤

### 步骤1：检查修改状态
```bash
# 查看哪些文件被修改
git status

# 查看具体修改内容
git diff
```

### 步骤2：添加修改到暂存区
```bash
# 添加所有修改
git add .

# 或添加特定文件
git add 文件名
```

### 步骤3：提交修改
```bash
# 提交并添加描述
git commit -m "描述修改内容"

# 提交示例：
git commit -m "更新logo图标"
git commit -m "修复筛选功能"
git commit -m "添加新筛选规则"
```

### 步骤4：推送到GitHub
```bash
# 推送到main分支
git push origin main

# 如果首次推送，使用：
git push -u origin main
```

## 🔄 自动部署流程
```
本地修改 → git提交 → 推送到GitHub → 自动部署 → 网站更新
```

### 部署时间线：
- **推送后**：GitHub Actions自动触发（1分钟内）
- **构建**：1-2分钟
- **部署**：1-2分钟
- **网站更新**：总共2-4分钟

## 📊 验证部署

### 1. 查看GitHub Actions状态
访问：`https://github.com/HoltCloud/data/actions`
- ✅ 绿色：部署成功
- ❌ 红色：部署失败（点击查看错误）

### 2. 访问更新后的网站
```
https://holtcloud.github.io/data/
```

### 3. 清除浏览器缓存（如果需要）
- **Windows/Linux**：Ctrl + Shift + R
- **Mac**：Cmd + Shift + R

## 💡 最佳实践

### 提交信息规范
- 简洁明了，描述修改内容
- 使用中文或英文
- 示例：
  - "更新网页标题和图标"
  - "修复南红筛选逻辑"
  - "添加金条排除条件"

### 频繁提交
- 小步提交，每次一个功能或修复
- 避免一次性提交大量修改

### 本地测试
```bash
# 构建测试
npm run build

# 本地预览
npm run preview
# 或
npx serve dist -p 3000
```

## 🆘 常见问题

### 问题1：推送失败
```bash
# 先拉取最新代码
git pull origin main

# 解决冲突后重新推送
git add .
git commit -m "解决冲突"
git push origin main
```

### 问题2：忘记提交描述
```bash
# 修改上次提交信息
git commit --amend -m "新的提交信息"
git push -f origin main  # 谨慎使用！
```

### 问题3：撤销修改
```bash
# 撤销未提交的修改
git checkout -- 文件名

# 撤销已暂存的修改
git reset HEAD 文件名
```

## 📞 快速参考
- **GitHub仓库**：`https://github.com/HoltCloud/data`
- **网站地址**：`https://holtcloud.github.io/data/`
- **部署状态**：`https://github.com/HoltCloud/data/actions`

记住：每次 `git push origin main` 都会自动更新网站！
