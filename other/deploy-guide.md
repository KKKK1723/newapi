# New-API 项目部署指南

## 项目基本信息

- **项目类型**: Go + React 全栈 AI 网关管理平台（基于 One API 二次开发）
- **Go 模块名**: `github.com/QuantumNous/new-api`
- **后端**: Go 1.25.1 + Gin + GORM
- **前端**: React 18 + Vite + Semi Design（位于 `web/` 目录）
- **本地源码路径**: `F:\github-clone\new-api`

## 云服务器信息

- **IP**: 154.219.114.21
- **SSH 密码**: RSG2lwBVp3W7
- **OS**: Ubuntu (Linux 5.4.0) x86_64
- **运行目录**: `/opt/new-api/`
- **反向代理**: Caddy（80/443 → 3000）

## 运行方式（非 Docker！）

服务器上**不是 Docker 部署**，是直接运行二进制文件：

```bash
cd /opt/new-api && ./new-api
```

进程通过 nohup 后台运行，日志输出到 `app.log`。

## 数据库

- **类型**: SQLite（不是 MySQL/PostgreSQL）
- **文件路径**: `/opt/new-api/one-api.db`
- **没有 .env 文件**，没有 Redis，全部使用默认配置
- **数据库中有生产数据**（用户、渠道、令牌、日志等），绝对不能删除或重置

| 表 | 记录数（截至 2026-02-10） |
|---|---|
| users | 18 |
| channels | 6 |
| tokens | 32 |
| logs | 13,525 |
| abilities | 20 |

## 本地开发

```bash
# 1. 启动 Go 后端（端口 3000，无热更新）
cd F:\github-clone\new-api
go run main.go

# 2. 启动 Vite 前端开发服务器（端口 5173，热更新）
cd web
bun run dev
```

| 端口 | 服务 | 热更新 | 说明 |
|---|---|---|---|
| 3000 | Go 后端 | 否 | API 服务 + 嵌入的静态前端（修改后端代码需重启） |
| 5173 | Vite 前端 | 是 | 前端开发服务器，`/api` 等请求自动代理到 3000 |

**开发时访问 `http://localhost:5173`** 获得前端热更新体验。如果只改后端，可以直接访问 `http://localhost:3000`。

## 编译与部署流程

### 1. 本地编译（Windows → Linux amd64）

```bash
# 在项目根目录 F:\github-clone\new-api 下执行
# 需要先设置交叉编译环境变量
set GOOS=linux
set GOARCH=amd64
set CGO_ENABLED=0
go build -ldflags "-s -w" -o new-api
```

> 如果前端有修改，需要先构建前端：
> ```bash
> cd web && bun install && bun run build && cd ..
> ```
> 前端构建产物在 `web/dist/`，会被 Go 嵌入到二进制中。

### 2. 上传到服务器

```bash
scp ./new-api root@154.219.114.21:/opt/new-api/new-api-new
```

### 3. 服务器上替换并重启

```bash
ssh root@154.219.114.21

# 进入目录
cd /opt/new-api

# 停止旧进程
kill $(pgrep -f './new-api')

# 备份旧二进制（可选）
cp new-api new-api.bak

# 替换
mv new-api-new new-api
chmod +x new-api

# 启动
nohup ./new-api > app.log 2>&1 &

# 确认启动成功
sleep 2 && ps aux | grep new-api | grep -v grep
```

### 4. 关键注意事项

- **不要动 `one-api.db` 文件**，新二进制启动后会自动使用同目录下的 `one-api.db`
- **不要添加 SQL_DSN 环境变量**，默认就是使用 SQLite
- 如果代码中数据库有新增字段/表，GORM 的 AutoMigrate 会自动处理，不会丢数据
- 服务监听端口 `3000`，Caddy 反代到 80/443

### 5. Claude Code 远程部署坑点（Windows SSH）

本地环境是 Windows + Git Bash，通过 Claude Code 执行 SSH 命令时有以下问题：

#### 坑 1：SSH 命令 stdout 丢失

普通 `ssh root@IP "command"` 执行后，命令实际成功但 stdout 不会被 Claude Code 捕获（exit code 显示为 255 或 1），原因是 SSH 密码认证的 stderr 输出干扰了返回值。

**解决方案**：将 stdout 重定向到本地文件，再读取文件内容：

```bash
ssh root@154.219.114.21 "command" > "C:/Users/20524/ssh_result.txt" 2>/dev/null
cat "C:/Users/20524/ssh_result.txt"
```

#### 坑 2：`$()` 变量替换被本地 Shell 展开

双引号包裹的远程命令中，`$(pgrep -f './new-api')` 会在本地 Shell 先展开（结果为空），导致 `kill` 命令没有参数。

**解决方案**：用单引号包裹远程命令，或用 heredoc：

```bash
# 单引号（简单命令）
ssh root@IP 'kill $(pgrep -f new-api)'

# heredoc（复杂脚本，推荐）
ssh root@IP 'bash -s' > result.txt 2>/dev/null << 'SCRIPT'
cd /opt/new-api
pkill -f "./new-api" || true
sleep 2
cp new-api new-api.bak
mv new-api-new new-api
chmod +x new-api
nohup ./new-api > app.log 2>&1 &
sleep 3
pgrep -f "./new-api" && echo "OK" || echo "FAIL"
tail -5 app.log
SCRIPT
```

#### 坑 3：scp 正常但 ssh 报错

`scp` 上传文件可以成功，但 `ssh` 执行命令却报 exit code 255。这是因为 scp 不需要 tty，而 ssh 密码认证在非交互环境下会尝试打开 `/dev/tty` 失败。实际上命令已经执行成功，只是返回码不可靠。

**判断方法**：看重定向到文件的输出内容，不要依赖 exit code。

#### 推荐的一键部署命令

```bash
# 1. 上传
scp ./new-api root@154.219.114.21:/opt/new-api/new-api-new

# 2. 远程替换并重启（用 heredoc + 输出到文件）
ssh root@154.219.114.21 'bash -s' > "C:/Users/20524/deploy_out.txt" 2>/dev/null << 'SCRIPT'
cd /opt/new-api
pkill -f "./new-api" 2>/dev/null || true
sleep 2
pgrep -f "new-api" && echo "WARNING: old process still running" || echo "OK: process stopped"
cp new-api new-api.bak
mv new-api-new new-api
chmod +x new-api
nohup ./new-api > app.log 2>&1 &
sleep 3
pgrep -f "./new-api" && echo "OK: new process started" || echo "FAIL: process not started"
tail -5 app.log
SCRIPT
cat "C:/Users/20524/deploy_out.txt"
```

## 服务器上其他服务

| 端口 | 服务 |
|---|---|
| 22 | SSH |
| 80/443 | Caddy（反代 new-api） |
| 3000 | new-api 主服务 |
| 3001 | Docker 容器服务 |
| 6099/6185 | Docker 容器服务 |
| 8000-8040 | warp2api |

## 目录结构速览

```
/opt/new-api/
├── new-api          # 当前运行的二进制
├── new-api.bak      # 上一版备份
├── one-api.db       # ⚠️ 生产数据库（SQLite）不要删！
├── app.log          # 运行日志
├── data/            # 数据目录
├── logs/            # 日志目录
└── web/             # 前端静态文件（可能已嵌入二进制）
```
