# 个人门户网站 · 设计文档

**日期：** 2026-04-02
**项目：** 个人信息记录与收集门户
**部署目标：** 阿里云服务器

---

## 1. 项目概述

一个部署在阿里云服务器上的个人综合门户网站，用于记录和整理个人信息。支持访客公开浏览所有内容，管理员通过密码进入管理模式，可配置网站外观、菜单结构和内容。

### 核心特性

- 全部内容公开，访客无需登录即可浏览
- 管理员密码登录后进入内容管理模式
- 支持文章笔记、链接收藏、文件图片、计划待办四类内容
- 两级菜单结构，管理员可自由配置
- 深色/浅色主题跟随系统，支持手动切换
- 管理员可调整主题色、侧边栏、网站标题等外观

---

## 2. 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端 | Vue 3 + Vite + Vue Router | SPA，Composition API |
| UI 组件 | 自定义组件 + TailwindCSS | 深色/浅色双主题 |
| 富文本编辑 | Tiptap | 文章编辑器 |
| 后端 | Node.js + Express | REST API |
| 数据库 | SQLite (better-sqlite3) | 单文件，零运维 |
| 认证 | JWT (jsonwebtoken) + bcrypt | 管理员身份验证 |
| 部署 | PM2 + Nginx | 进程守护 + 反向代理 |
| HTTPS | Let's Encrypt (certbot) | 自动续签证书 |

---

## 3. 系统架构

```
阿里云服务器
├── Nginx :80/:443
│   ├── / → 提供 Vue SPA 静态文件 (dist/)
│   └── /api/* → 反向代理到 Express :3000
├── Express :3000 (PM2 守护)
│   ├── /api/menus        菜单读取
│   ├── /api/contents     内容读取
│   ├── /api/settings     网站配置读取
│   └── /api/admin/*      管理接口（JWT 鉴权）
└── SQLite data.db
```

**数据流：**
1. 用户请求域名 → Nginx 返回 `index.html`
2. Vue Router 接管客户端路由，按需请求 `/api/*`
3. Express 查询 SQLite，返回 JSON
4. 管理员登录后携带 JWT token，访问 `/api/admin/*` 接口

---

## 4. 页面结构

### 三层页面导航

```
首页 /
└── 一级菜单详情页 /:menuSlug
    └── 内容详情页 /:menuSlug/:contentId
```

### 布局结构（所有页面共用）

```
┌─────────────────────────────────────────┐
│  左侧侧边栏（固定）  │  右侧内容区（变化） │
│                    │                   │
│  一级菜单列表       │  首页：菜单预览卡片  │
│  ↓（进入菜单后）    │  详情页：内容列表   │
│  二级分类列表       │  内容页：内容正文   │
│                    │                   │
│  底部：🔐 管理员    │                   │
└─────────────────────────────────────────┘
```

### 各层详细说明

**首页 `/`**
- 左侧：一级菜单导航列表
- 右侧：每个一级菜单的预览卡片（图标 + 名称 + 最近1条内容摘要）
- 点击卡片跳转到对应一级菜单详情页

**一级菜单详情页 `/:menuSlug`**
- 左侧上方：一级菜单列表（当前高亮）
- 左侧下方：当前菜单的二级分类列表（动态展开，默认选中全部）
- 右侧：内容列表，按二级分类过滤，按时间倒序
- 点击内容条目跳转到内容详情页

**内容详情页 `/:menuSlug/:contentId`**
- 侧边栏保持不变（菜单和二级分类）
- 右侧：内容正文，根据类型渲染不同 UI：
  - `article`：Markdown/富文本渲染
  - `link`：链接卡片 + 描述
  - `file`：图片预览 / 文件下载
  - `todo`：待办列表（访客只读，管理员可编辑）

---

## 5. 数据模型

### menus 表

```sql
CREATE TABLE menus (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,        -- 菜单显示名称
  icon       TEXT    NOT NULL,        -- emoji 或图标名
  slug       TEXT    NOT NULL UNIQUE, -- URL 路径片段
  parent_id  INTEGER REFERENCES menus(id) ON DELETE CASCADE,
                                      -- NULL = 一级菜单
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### contents 表

```sql
CREATE TABLE contents (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id    INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  type       TEXT    NOT NULL CHECK(type IN ('article','link','file','todo')),
  body       TEXT,                    -- Markdown/HTML/JSON
  meta       TEXT,                    -- JSON: 链接URL、文件路径、待办条目等
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### settings 表

```sql
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL                 -- JSON 序列化
);

-- 默认值
INSERT INTO settings VALUES
  ('theme_mode',   '"auto"'),          -- "auto"|"dark"|"light"
  ('accent_color', '"#6366f1"'),       -- 主题强调色
  ('site_title',   '"我的个人空间"'),
  ('sidebar_width', '160');
```

### admin 表

```sql
CREATE TABLE admin (
  id            INTEGER PRIMARY KEY,
  password_hash TEXT NOT NULL         -- bcrypt 哈希，不存明文
);
```

---

## 6. API 设计

### 公开接口（无需鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/menus` | 获取完整菜单树（含二级分类） |
| GET | `/api/menus/:slug/contents` | 获取菜单下内容列表，支持 `?category=` 过滤 |
| GET | `/api/contents/:id` | 获取单条内容详情 |
| GET | `/api/settings` | 获取网站配置（主题、标题等） |

### 管理员接口（需 JWT Bearer Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 密码登录，返回 JWT |
| GET | `/api/admin/menus` | 获取菜单列表（含隐藏项） |
| POST | `/api/admin/menus` | 新建菜单/分类 |
| PUT | `/api/admin/menus/:id` | 编辑菜单 |
| DELETE | `/api/admin/menus/:id` | 删除菜单（级联删除内容） |
| PUT | `/api/admin/menus/reorder` | 批量更新排序 |
| POST | `/api/admin/contents` | 新建内容 |
| PUT | `/api/admin/contents/:id` | 编辑内容 |
| DELETE | `/api/admin/contents/:id` | 删除内容 |
| PUT | `/api/admin/settings` | 更新网站配置 |
| POST | `/api/admin/upload` | 上传文件，返回文件路径 |

---

## 7. 管理员功能

### 入口
- 侧边栏底部显示 🔐 图标
- 点击弹出密码输入框
- 密码验证通过后，页面顶部出现管理员工具栏（浮动条）

### 安全策略
- 密码用 bcrypt 哈希存储（salt rounds = 12）
- JWT token 有效期 24 小时，存 `localStorage`
- 连续 5 次密码错误，锁定当前 IP 10 分钟（`express-rate-limit` 内存实现，重启清零，个人站够用）
- 所有 `/api/admin/*` 接口强制验证 JWT

### 管理工具栏功能

```
[ ✏️ 编辑内容 ]  [ 📂 菜单管理 ]  [ 🎨 外观设置 ]  [ 🚪 退出 ]
```

**① 编辑内容**（上下文感知）
- 首页：打开新建一级菜单表单
- 一级详情页：显示内容列表管理（新增/编辑/删除/排序）
- 内容详情页：进入当前内容的编辑模式（富文本/表单）

**② 菜单管理**（右侧抽屉）
- 拖拽调整一级菜单排序
- 展开每个一级菜单，管理其二级分类
- 编辑菜单的图标、名称、slug
- 新增/删除菜单和分类（删除时提示确认）

**③ 外观设置**（弹出面板）
- 主题模式：深色 / 浅色 / 跟随系统（radio）
- 强调色：预设色盘 + 自定义输入
- 网站标题：文本输入
- 侧边栏宽度：滑块（120px ~ 240px）
- 所有设置实时预览，保存后写入 `settings` 表

---

## 8. 主题系统

- CSS 变量驱动，切换主题只需修改 `:root` 变量
- `prefers-color-scheme` media query 实现自动跟随系统
- `localStorage` 存储用户手动选择，优先级高于系统设置
- 强调色通过 CSS 变量 `--color-accent` 全局生效

```css
:root {
  --color-accent: #6366f1;
  --color-bg: #0f172a;        /* dark mode default */
  --color-surface: #1e293b;
  --color-text: #e2e8f0;
  --color-muted: #64748b;
  --sidebar-width: 160px;
}
```

---

## 9. 项目目录结构

```
any-plan/
├── frontend/                  # Vue 3 + Vite
│   ├── src/
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   ├── MenuView.vue
│   │   │   └── ContentView.vue
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppSidebar.vue
│   │   │   │   └── AdminToolbar.vue
│   │   │   ├── admin/
│   │   │   │   ├── MenuManager.vue
│   │   │   │   ├── AppearancePanel.vue
│   │   │   │   └── ContentEditor.vue
│   │   │   └── content/
│   │   │       ├── ArticleRenderer.vue
│   │   │       ├── LinkCard.vue
│   │   │       ├── FilePreview.vue
│   │   │       └── TodoList.vue
│   │   ├── stores/            # Pinia
│   │   │   ├── menu.ts
│   │   │   ├── settings.ts
│   │   │   └── auth.ts
│   │   ├── router/index.ts
│   │   └── main.ts
│   └── vite.config.ts
│
├── backend/                   # Express
│   ├── src/
│   │   ├── routes/
│   │   │   ├── menus.ts
│   │   │   ├── contents.ts
│   │   │   ├── settings.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts        # JWT 验证
│   │   │   └── rateLimit.ts   # 登录频率限制
│   │   ├── db/
│   │   │   ├── index.ts       # better-sqlite3 初始化
│   │   │   └── migrate.ts     # 建表 & 初始数据
│   │   └── app.ts
│   └── package.json
│
├── uploads/                   # 文件上传存储目录（Nginx 直接提供静态服务）
├── data.db                    # SQLite 数据库文件
├── nginx.conf                 # Nginx 配置模板
├── ecosystem.config.js        # PM2 配置
└── docs/
    └── superpowers/specs/
        └── 2026-04-02-personal-portal-design.md
```

---

## 10. 部署步骤（概览）

1. 阿里云服务器安装 Node.js 20 LTS、Nginx、PM2
2. `git clone` 项目到服务器
3. `cd backend && npm install && npm run migrate`（初始化数据库）
4. `cd frontend && npm install && npm run build`（构建静态文件）
5. `pm2 start ecosystem.config.js`（启动 Express）
6. 配置 Nginx，指向 `frontend/dist/` 和代理 `/api/*`
7. `certbot --nginx` 申请 HTTPS 证书

---

## 11. 范围说明（本期不包含）

- 搜索功能（全文检索）
- 内容标签系统
- RSS 订阅
- 多管理员账户
- 内容版本历史
- 评论系统
