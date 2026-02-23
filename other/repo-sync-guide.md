# 仓库同步指南

## 仓库信息

- **二开仓库**: https://github.com/KKKK1723/newapi
- **上游仓库**: https://github.com/QuantumNous/new-api (remote: `origin`)
- **二开远程名**: `newapi`
- **本地路径**: `F:\github-clone\new-api`

## 同步流程

每次新增功能或修改后，按以下步骤同步到二开仓库：

### 1. 暂存并提交

```bash
cd F:\github-clone\new-api
git add <涉及的文件>
git commit -m "feat: 简要描述本次改动"
```

### 2. 更新 README

在 `README.md` 的「二开改动」章节中补充本次新增/修改的功能说明。

### 3. 推送到二开仓库

```bash
git push newapi main
```

## 同步记录

| 日期 | 提交摘要 | 主要改动 |
|---|---|---|
| 2026-02-21 | feat: 基于 Calcium-Ion/new-api 的二次开发定制版 | 首次上传，含 IP 封禁、邀请码系统、IP 统计页面、监测页面（已隐藏）、钱包 UI 调整、首页/导航定制 |
