# Tasks
- [x] Task 1: 上传入口改为右上角悬浮按钮（FAB）
  - [x] SubTask 1.1: 在全局布局中新增小型悬浮上传按钮并复用现有上传弹层
  - [x] SubTask 1.2: 调整样式与层级，避免遮挡主要内容
- [x] Task 2: agents 模块接入 GitHub 热门 TOP10
  - [x] SubTask 2.1: 选取并固化 10 个热门 agent 仓库数据（名称+地址）
  - [x] SubTask 2.2: 在 agents 页面顶部渲染可点击推荐列表
- [x] Task 3: skills 模块接入 GitHub 热门 TOP10
  - [x] SubTask 3.1: 选取并固化 10 个热门 skill 相关仓库数据（名称+地址）
  - [x] SubTask 3.2: 在 skills 页面顶部渲染可点击推荐列表
- [x] Task 4: 验证与安全收口
  - [x] SubTask 4.1: 所有外链统一为新窗口且带 noopener/noreferrer
  - [x] SubTask 4.2: 本地构建/运行验证页面展示和跳转行为

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2 and Task 3
