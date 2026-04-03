# Tasks
- [x] Task 1: 识别当前 Git 状态与远程
  - [x] SubTask 1.1: 检查是否已初始化 Git 仓库与远程 origin
  - [x] SubTask 1.2: 获取当前分支与待提交文件列表
- [x] Task 2: 生成提交
  - [x] SubTask 2.1: 按规范撰写提交信息（包含本次变更摘要）
  - [x] SubTask 2.2: 将变更全部添加并提交到当前分支
- [x] Task 3: 推送到 GitHub
  - [x] SubTask 3.1: 若无远程则添加远程并设置上游
  - [x] SubTask 3.2: 推送到远程分支
- [x] Task 4: 失败处理
  - [x] SubTask 4.1: 鉴权失败时提示配置 PAT 或 SSH 密钥并重试
  - [x] SubTask 4.2: 冲突或拒绝时拉取/合并后再次推送

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
