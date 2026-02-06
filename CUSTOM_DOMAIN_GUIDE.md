# Cloudflare CNAME记录配置指南

## 前提条件
1. 您的域名已托管在Cloudflare
2. GitHub Pages已成功部署（访问：`https://holtcloud.github.io/data/`）
3. 您拥有要使用的自定义域名（例如：`datatool.yourdomain.com`）

## 步骤1：在GitHub Pages添加自定义域名

### 1.1 进入GitHub仓库设置
1. 访问：`https://github.com/HoltCloud/data/settings/pages`
2. 在"Custom domain"部分输入您的域名（例如：`datatool.yourdomain.com`）
3. 点击 **"Save"**

### 1.2 验证域名所有权
1. GitHub会显示需要配置的DNS记录
2. 通常需要添加以下记录之一：
   - **CNAME记录**：指向 `holtcloud.github.io`
   - 或 **A记录**：指向GitHub Pages的IP地址

## 步骤2：在Cloudflare配置CNAME记录

### 2.1 登录Cloudflare
1. 访问：`https://dash.cloudflare.com`
2. 选择您的域名

### 2.2 添加CNAME记录
1. 进入 **"DNS"** → **"Records"**
2. 点击 **"Add record"**
3. 配置如下：

| 字段 | 值 | 说明 |
|------|-----|------|
| Type | CNAME | 选择CNAME记录类型 |
| Name | datatool | 子域名部分（完整域名为：datatool.yourdomain.com） |
| Target | holtcloud.github.io | GitHub Pages地址 |
| TTL | Auto | 自动TTL |
| Proxy status | ⚠️ **重要：选择DNS only** | 必须关闭橙色云（Proxy），选择灰色云 |

4. 点击 **"Save"**

### 2.3 验证记录
记录添加后应该显示如下：
```
Type    Name          Content                 TTL     Proxy status
CNAME   datatool      holtcloud.github.io     Auto    DNS only
```

## 步骤3：等待DNS传播
1. DNS更改通常需要 **5-30分钟** 生效
2. 您可以使用以下命令检查DNS解析：
   ```bash
   dig datatool.yourdomain.com
   # 或
   nslookup datatool.yourdomain.com
   ```

## 步骤4：在GitHub验证域名
1. 返回GitHub Pages设置
2. 等待显示 **"Your site is published at https://datatool.yourdomain.com"**
3. 如果显示"DNS check in progress"，请等待几分钟

## 步骤5：启用HTTPS（自动）
1. GitHub Pages会自动为自定义域名配置SSL证书
2. 在GitHub Pages设置中勾选 **"Enforce HTTPS"**
3. 等待证书颁发（通常需要几分钟到几小时）

## 常见问题解决

### Q1: 为什么网站无法访问？
**检查步骤：**
1. 确认CNAME记录已正确添加
2. 确认Proxy状态为 **"DNS only"**（灰色云）
3. 等待DNS传播完成（最多24小时）
4. 在GitHub Pages设置中检查域名状态

### Q2: HTTPS证书不工作？
**解决方案：**
1. 在GitHub Pages设置中取消勾选"Enforce HTTPS"
2. 保存设置
3. 等待5分钟
4. 重新勾选"Enforce HTTPS"
5. 等待证书重新颁发

### Q3: 想使用根域名（yourdomain.com）？
**配置方法：**
1. 在GitHub Pages设置中使用根域名
2. 在Cloudflare添加 **A记录**：
   - Type: A
   - Name: @ (或留空)
   - Content: 
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - TTL: Auto
   - Proxy: DNS only

### Q4: Cloudflare Proxy（橙色云）问题
**重要：** GitHub Pages与Cloudflare Proxy不兼容，必须使用 **"DNS only"**（灰色云）。

### Q5: 如何验证配置正确？
**测试命令：**
```bash
# 检查DNS解析
dig datatool.yourdomain.com +short
# 应该返回：holtcloud.github.io

# 检查最终IP
dig holtcloud.github.io +short
```

## 高级配置

### 使用www子域名
如果您想使用`www.yourdomain.com`：
1. 在GitHub Pages设置中使用`www.yourdomain.com`
2. 在Cloudflare添加CNAME记录：
   - Type: CNAME
   - Name: www
   - Target: holtcloud.github.io
   - Proxy: DNS only

### 同时支持根域名和www
1. 按照上述方法配置根域名（A记录）和www子域名（CNAME记录）
2. 在GitHub Pages设置中添加两个域名
3. GitHub会自动重定向

## 完成验证
配置完成后，您的网站将通过以下地址访问：
- `https://datatool.yourdomain.com`（自定义域名）
- `https://holtcloud.github.io/data`（GitHub Pages地址）

两个地址都会显示相同的内容。