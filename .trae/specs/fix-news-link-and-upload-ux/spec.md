# 新闻链接与上传体验修复 Spec

## Why
当前项目在新闻跳转、首页布局、新闻列表展示与资料详情阅读上存在明显可用性问题，影响核心功能闭环和学习体验。

## What Changes
- 修复新闻卡片点击后链接跳转错误，确保跳到新闻原始文章而非站点首页。
- 调整首页上传入口布局：将大面积上传区改为右上角轻量入口。
- 移除 AI 新闻页分页，改为单页纵向滚动展示最多 50 条新闻。
- 修复上传资料详情页不可阅读问题，确保可预览/阅读已上传内容。

## Impact
- Affected specs: 新闻浏览、首页交互、资料管理与阅读
- Affected code: `frontend/src/App.tsx`、样式文件、后端上传/读取相关接口与数据处理逻辑

## ADDED Requirements
### Requirement: 新闻外链准确跳转
系统 SHALL 在点击新闻卡片或外链入口时，使用新闻数据中的完整原始 URL 进行跳转，不得丢失路径参数或被重写为网站首页。

#### Scenario: Success case
- **WHEN** 用户在 AI 新闻页面点击任一新闻卡片的外链入口
- **THEN** 浏览器打开该新闻的正确原文链接页面

### Requirement: 首页上传入口轻量化
系统 SHALL 将上传入口放置在首页右上角，且不再以大面积模块占据首页主内容区域。

#### Scenario: Success case
- **WHEN** 用户打开首页
- **THEN** 可在右上角看到上传入口并可正常触发上传流程，首页主体仍以导航内容为主

### Requirement: 新闻页长列表展示
系统 SHALL 在 AI 新闻页面以可滚动列表方式展示最多 50 条新闻，不使用分页控件。

#### Scenario: Success case
- **WHEN** 用户进入 AI 新闻页面
- **THEN** 页面连续展示新闻列表并可上下滚动查看全部条目

### Requirement: 资料详情可读
系统 SHALL 在资料详情页对已上传资料提供可阅读内容展示（文本/Markdown/PDF 等支持类型），并对不支持类型给出明确提示。

#### Scenario: Success case
- **WHEN** 用户打开某条已上传资料详情
- **THEN** 若格式受支持则直接可阅读；若不支持则展示可理解的降级提示

## MODIFIED Requirements
### Requirement: 首页信息层级
首页内容组织应以分类导航与核心内容为主，上传功能作为辅助入口呈现，不得抢占首屏主要视觉区域。

## REMOVED Requirements
### Requirement: 新闻分页浏览
**Reason**: 分页增加浏览负担，不符合“快速连续浏览热点”的使用场景。  
**Migration**: 迁移为单页滚动列表并保留现有新闻数据加载逻辑。
