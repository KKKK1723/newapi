# New API (二次开发版)

基于 [Calcium-Ion/new-api](https://github.com/Calcium-Ion/new-api) 进行的二次开发，新增了自定义功能和 UI 调整。

## 上游项目

- [Calcium-Ion/new-api](https://github.com/Calcium-Ion/new-api) — 新一代大模型网关与 AI 资产管理系统
- [songquanpeng/one-api](https://github.com/songquanpeng/one-api) — 原版 One API

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Go 1.25 + Gin + GORM |
| 前端 | React 18 + Vite + Semi Design |
| 数据库 | SQLite / MySQL / PostgreSQL |

## 二开改动

### 后端

- IP 封禁管理（`middleware/ip_ban.go`、`model/banned_ip.go`、`controller/banned_ip.go`）
- 邀请码系统（`model/invitation.go`、`controller/invitation.go`）
- 注册邀请码校验
- 日志统计 API 增强（IP 维度统计）

### 前端

- 自定义首页样式与 Logo
- IP 访问统计页面（`web/src/pages/IpStats/`）
- 邀请码管理页面（`web/src/pages/Invitation/`）
- 模型可用性监测页面（`web/src/pages/Monitor/`，已隐藏入口）
- 钱包页面 UI 调整（充值提示文案、布局居中）
- 导航栏 / 侧边栏菜单项调整

## 本地开发

```bash
# 启动后端（端口 3000）
go run main.go

# 启动前端（端口 5173，热更新）
cd web && bun install && bun run dev
```

开发时访问 `http://localhost:5173`，API 请求自动代理到后端 3000 端口。

## 编译部署

```bash
# 构建前端
cd web && bun install && bun run build && cd ..

# 交叉编译 Linux 二进制
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w" -o new-api
```

## License

本项目遵循上游 [AGPL-3.0](LICENSE) 协议。
