# 模型可用性监测功能 - 开发进展

## 基本信息

- **功能名称**: 模型可用性监测（Model Availability Monitor）
- **开始日期**: 2026-02-19
- **当前状态**: 已搁置（2026-02-21）。前端页面保留但导航入口已隐藏
- **路由地址**: `/monitor`

## 参考对标

- **参考站点**: https://check.cifang.xyz/ （此方的 AnyRouter 监测站）
- **技术栈**: Next.js + Vercel，通过 `/api/dashboard` 端点提供数据
- **核心功能**: 实时监测 OpenAI / Gemini / Anthropic 对话接口的可用性与延迟

## 已完成工作

### 1. 导航调整

- **隐藏**: 顶部导航栏的「关于」入口（`about: false`）
- **新增**: 「模型可用性监测」导航项，链接到 `/monitor`（**已隐藏**，`monitor: false`）
- **兼容**: 后端配置 `headerNavModules` 未包含 `monitor` 时默认**不显示**

**涉及文件:**
- `web/src/hooks/common/useNavigation.js` — 导航配置
- `web/src/App.jsx` — 新增 `/monitor` 路由
- `web/src/i18n/locales/en.json` — 英文翻译

### 2. 监测页面前端（Mock 数据）

**新建文件:** `web/src/pages/Monitor/index.jsx`

**监测模型（3 个）:**

| 模型 | Model ID | 基准延迟 | 基准 Ping |
|---|---|---|---|
| Claude Sonnet 4.6 | claude-sonnet-4-6 | 2371 ms | 293 ms |
| Claude Opus 4.6 | claude-opus-4-6 | 4010 ms | 285 ms |
| Claude Haiku 4.5 | claude-haiku-4-5-20251001 | 2093 ms | 283 ms |

**页面结构:**

```
┌─────────────────────────────────────────────────┐
│ Header                                          │
│  - Model Monitor 标签 + 标题 + 副标题            │
│  - 可用性区间切换（7天/15天/30天）                │
│  - 运行状态指示灯（绿色脉冲动画）                 │
│  - 更新时间 + 刷新按钮                           │
├─────────────────────────────────────────────────┤
│ 卡片网格（1/2/3 列响应式）                       │
│                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ 模型名称  │ │ 模型名称  │ │ 模型名称  │         │
│ │ 状态标签  │ │ 状态标签  │ │ 状态标签  │         │
│ │ 延迟/Ping │ │ 延迟/Ping │ │ 延迟/Ping │         │
│ │ 上游状态  │ │ 上游状态  │ │ 上游状态  │         │
│ │ 可用性 %  │ │ 可用性 %  │ │ 可用性 %  │         │
│ │ 历史图表  │ │ 历史图表  │ │ 历史图表  │         │
│ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────┘
```

**卡片功能细节:**
- 模型图标 + 名称 + 状态标签（正常绿/延迟黄/错误红）
- Provider 名称 + model ID（灰色等宽字体）
- 对话延迟（ms）+ 端点 PING（ms）指标框
- 可折叠的「上游状态」区域
- 可用性百分比（颜色：≥95% 绿、≥80% 黄、<80% 红）
- 60 点历史条形图（Past → Now），柱子自适应宽度填满容器
- 柱子 hover 效果：向上浮动 4px + 白底 Tooltip 显示状态/时间/延迟/Ping
- 刷新按钮：mock 模拟数据更新，旋转动画

**状态类型:**

| 状态 | 标签 | 颜色 |
|---|---|---|
| operational | 正常 | #16a34a (green-600) |
| degraded | 延迟 | #f59e0b (amber-500) |
| failed | 错误 | #ef4444 (red-500) |

## 搁置说明

- **搁置日期**: 2026-02-21
- **原因**: 决定不继续开发此功能
- **处理方式**: 导航入口已隐藏（`useNavigation.js` 中 `monitor: false`），前端页面代码和路由保留未删除
- **恢复方式**: 将 `web/src/hooks/common/useNavigation.js` 中 `monitor` 改回 `true` 即可重新显示

## 待实现（后端 + 联调）— 已搁置

### 后端需要实现的功能

1. **定时检测任务**
   - 建议间隔: 3 分钟/次
   - 对每个配置的模型发送最简请求（如 prompt="hi", max_tokens=1）
   - 记录: 状态（成功/失败）、对话延迟（ms）、端点 Ping（ms）、时间戳

2. **数据存储**
   - 新建数据库表存储检测记录（model_id, status, latency, ping, checked_at）
   - 需要数据清理策略（如保留 30 天）

3. **API 接口**
   - `GET /api/monitor/status` — 返回所有模型的最新状态 + 统计 + 历史数据
   - 参数: `period`（7d/15d/30d）控制可用性统计和历史范围

4. **模型配置**
   - 监测哪些模型应可配置（当前硬编码 3 个）
   - 可考虑复用现有渠道(channel)配置

### 前端联调

- 替换 Mock 数据为真实 API 调用
- 实现自动轮询刷新（基于检测间隔）
- 周期切换联动后端 period 参数
- 上游状态对接 Anthropic 官方状态页（可选）

## 技术备注

- 前端使用 Semi Design 组件（Tooltip, Collapsible, Typography）+ Tailwind CSS 布局
- 颜色使用 Semi CSS 变量（`--semi-color-*`）适配明暗主题
- Tooltip 强制白底（`#fff`）+ 固定深色文字，不跟随主题
- 历史柱状图绿色为 `#16a34a`（green-600），默认不透明度 0.85
