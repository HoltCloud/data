# DataTool

面向珠宝质检与订单履约场景的浏览器端数据工具。文件在本地浏览器中解析，不会上传到服务器。

## 功能

- CSV 质检数据规则筛选、排序和证书编码复制
- Excel 检测批次统计、剩余时间和逾期跟踪
- Excel 入库量时段分析
- 按商家统计待绑码和待入库订单

## 本地开发

```bash
npm ci
npm run dev
```

## 质量检查

```bash
npm test
npm run lint
npm run build
```

## 部署

主分支推送后，`.github/workflows/deploy.yml` 会将 `dist` 自动部署到 GitHub Pages。Vite 的公共路径是 `/data/`，对应默认地址：

`https://holtcloud.github.io/data/`

项目也保留了 Cloudflare Worker 的静态站点配置，可通过 `npm run deploy` 部署。当前项目不使用 Supabase 或其他后端环境变量。
