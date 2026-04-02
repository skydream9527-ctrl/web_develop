# 上传悬浮按钮与 GitHub TOP10 推荐 Spec

## Why
进一步优化首页与全局上传入口的交互与视觉占用，并在 agents 与 skills 模块提供 GitHub 热门项目 TOP10 的直达参考，提升学习与实践效率。

## What Changes
- 将“上传弹层”入口改为右上角全局悬浮按钮（FAB），点击后打开现有上传弹层。
- 在 agents 与 skills 模块页面顶部增加“GitHub 热门 TOP10”推荐区，点击条目跳转其 GitHub 项目地址。
- 外链统一使用安全参数（target=_blank, rel=noopener noreferrer）。

## Impact
- Affected specs: 首页/全局交互、模块学习引导
- Affected code: `frontend/src/App.tsx`、`frontend/src/index.css`（可能新增组件/样式）；不修改后端

## ADDED Requirements
### Requirement: 全局上传悬浮按钮（FAB）
系统 SHALL 在页面右上角显示小型悬浮按钮作为上传入口；点击按钮打开现有上传弹层；在任意页面均可访问。

#### Scenario: Success case
- **WHEN** 用户在任一页面点击右上角悬浮上传按钮
- **THEN** 打开上传弹层，上传流程与之前一致

### Requirement: agents/skills GitHub TOP10 推荐
系统 SHALL 在 agents 与 skills 页面顶部显示 GitHub 热门项目 TOP10 推荐列表；点击任一条目跳转到其 GitHub 项目地址。

#### Scenario: Success case
- **WHEN** 用户进入 agents 或 skills 页面
- **THEN** 顶部可见 TOP10 推荐区；点击条目新开安全窗口到对应 GitHub 仓库

### Requirement: 外链安全与文案
系统 SHALL 对外链统一使用 target=_blank 且 rel=noopener noreferrer；推荐区给出“来源 GitHub 热门项目，仅供参考”的说明文案。

## MODIFIED Requirements
### Requirement: 首页上传入口呈现
首页不再展示占位较大的上传入口模块；上传入口由右上角悬浮按钮承担。

## REMOVED Requirements
无
