# Tasks
- [x] Task 1: 修复新闻外链跳转为正确原文
  - [x] SubTask 1.1: 在新闻卡片区域使用原始 URL 打开新窗口
  - [x] SubTask 1.2: 处理可能的 HTML/实体编码，避免被重写为首页
- [x] Task 2: 首页上传入口轻量化并移位
  - [x] SubTask 2.1: 将首页大块上传区移除
  - [x] SubTask 2.2: 在右上角 Header 增加轻量上传入口（弹层/抽屉）
- [x] Task 3: AI 新闻页改为纵向滚动长列表
  - [x] SubTask 3.1: 去除分页状态与控件
  - [x] SubTask 3.2: 展示最多 50 条新闻并优化卡片间距
- [x] Task 4: 资料详情可读性修复
  - [x] SubTask 4.1: 统一 PDF/Markdown/文本的展示逻辑与降级提示
  - [x] SubTask 4.2: 验证上传流程内容写入与详情页读取一致

# Task Dependencies
- Task 3 depends on Task 1（共用新闻列表卡片交互一致性）
- Task 4 depends on Task 2（上传入口触发流程与详情阅读联动验证）
