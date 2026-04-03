# SuperDreams 全栈研发工作台面板 (AI Agent Portal)

> 这个项目是一个集成了**安全拦截、动态外观设计引擎、多办公文档解析引擎以及动态富文本路由管理**在内的全栈平台。可作为高度定制化的工作室大屏或知识管理库。

## ✨ 核心特性 

*   **🔒 内外网脱机隔离与安全控制**
    *   **高标准存储密码**：利用 `bcrypt` 规避弱哈希破解，在数据库里只留下单向打乱的盐指纹。
    *   **防暴力破解引擎**：通过 `express-rate-limit` 中间件实施访问封锁，防止恶意程序刷管理后台登录接口。
    *   **无状态访问凭据**：采用 `jsonwebtoken` (JWT) 取代传统 Session 拦截后台关键写入 API。
*   **🎨 全动态外观设计引擎 (Design Engine)**
    *   零硬编码：抛弃传统的固化色调，利用 React 的生命周期联动 `getComputedStyle` 及全局 CSS Variables (`--primary-accent`, `--sidebar-width`)。
    *   在后台通过滑块和调色盘随时发布新的**侧面屏宽比**和**全局强调色**，立刻在全站和数据库持久化生效！支持极客暗黑 (Dark) 及纯净阅读 (Light) 主题瞬间切换。
*   **📚 全维脱机图解文档馆 (Material Viewer)**
    *   彻底告别传统云端转化（不向外泄露任何机密文档）。
    *   **Word 引擎**：接入 `mammoth` 将原生 Docx 无缝渲染为纯原生段落 DOM。
    *   **数据模型**：接入 `SheetJS (XLSX)` 让 Excel 及 CSV 账单本地呈递表格布局阅览。
    *   自带 PDF 原生框架套签支持以及 `React-Markdown` 代码高亮渲染。
*   **📜 "即写即发" 富文本数据关联分发系统**
    *   提供 `react-quill` 完整版“所见即所得”编辑器。
    *   文章关联到 Menu 节点下（例如在 Agents 版块下发一片教程），前端打开路由，即以大卡片格式沉浸展示！

## 🛠 技术栈
*   **Frontend (前台交互及渲染)**: [React 19](https://react.dev/) + TypeScript + Vite + Lucide React (图标)
*   **Backend (数据控制塔)**: Node.js + Express (API 提供者)
*   **Database (单体库)**: `SQLite3` (零配置的极致管理端，直接打包使用)

## 🚀 启动指引

### 1. 克隆与安装依赖
将仓库全部 Pull 下来后，需要为前端与后端分别安装各自的包：

```bash
# 启动后端 (默认端口 3001)
cd backend
npm install
npm start 
# 后端启动时会自动核实 sqlite 数据库，缺少表则自建，缺少系统设定将植入 Default 并打印初始哈希。

# 启动前端 (Vite)
cd ../frontend
npm install
npm run dev
```

### 2. 数据库与超级管理员
第一次运行后端 `db.js` 将在 `/backend` 目录下生成一个名为 `data.db` 的标准 SQLite 文件。
*   默认的超级管理员账户为：`admin`
*   默认随机初始化密码为：`admin123456`
*   进入应用后，请访问左下角的**管理员后台设置**立刻进行管理员验证更换（已集成 Bcrypt 加密）。

### 3. 数据备份
此系统的设计以极简化为原则。你仅仅需要备份 `/backend/data.db` 这一个文件，即可拷贝走所有的富文本发文记录、上传在本地的办公格式流文件以及你的自定义颜色主题偏好设置。

---
📝 *最后更新日期：2026/04*
