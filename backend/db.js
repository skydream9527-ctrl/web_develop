const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const db = new Database(path.join(__dirname, 'data.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    category TEXT
  );
  
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    skillId TEXT,
    user TEXT,
    content TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT,
    url TEXT,
    source TEXT,
    summary TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT,
    module TEXT,
    timestamp TEXT,
    isFolder INTEGER,
    fileCount INTEGER,
    content TEXT
  );

  CREATE TABLE IF NOT EXISTS submenus (
    pageId TEXT PRIMARY KEY,
    items TEXT
  );

  CREATE TABLE IF NOT EXISTS admins (
    username TEXT PRIMARY KEY,
    passwordHash TEXT,
    roles TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    body TEXT,
    meta TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Settings Default
const defaultSettings = {
    theme_mode: '"auto"',
    accent_color: '"#00f2fe"',
    site_title: '"AI 数据实践宝库"',
    sidebar_width: '"240"'
};

if (db.prepare('SELECT COUNT(*) as count FROM settings').get().count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    db.transaction(() => {
        for (const [k, v] of Object.entries(defaultSettings)) {
            insertSetting.run(k, v);
        }
    })();
}

// Migration logic
const dataFilePath = path.join(__dirname, 'data.json');
const isMigratedCheck = db.prepare('SELECT COUNT(*) as count FROM admins').get();

if (isMigratedCheck.count === 0 && fs.existsSync(dataFilePath)) {
    console.log('Starting migration from data.json to SQLite...');
    try {
        const rawData = fs.readFileSync(dataFilePath, 'utf8');
        const data = JSON.parse(rawData);

        db.transaction(() => {
            if (data.skills && Array.isArray(data.skills)) {
                const insertSkill = db.prepare('INSERT INTO skills (id, name, description, category) VALUES (?, ?, ?, ?)');
                for (const skill of data.skills) {
                    insertSkill.run(skill.id, skill.name, skill.description, skill.category);
                }
            }
            if (data.posts && Array.isArray(data.posts)) {
                const insertPost = db.prepare('INSERT INTO posts (id, skillId, user, content, timestamp) VALUES (?, ?, ?, ?, ?)');
                for (const post of data.posts) {
                    insertPost.run(post.id, post.skillId, post.user, post.content, post.timestamp);
                }
            }
            if (data.news && Array.isArray(data.news)) {
                const insertNews = db.prepare('INSERT INTO news (id, title, url, source, summary, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
                for (const item of data.news) {
                    insertNews.run(item.id, item.title, item.url, item.source, item.summary, item.timestamp);
                }
            }
            if (data.materials && Array.isArray(data.materials)) {
                const insertMaterial = db.prepare('INSERT INTO materials (id, name, module, timestamp, isFolder, fileCount, content) VALUES (?, ?, ?, ?, ?, ?, ?)');
                for (const material of data.materials) {
                    insertMaterial.run(material.id, material.name, material.module, material.timestamp, material.isFolder ? 1 : 0, material.fileCount, material.content || '');
                }
            }
            if (data.submenuConfig) {
                const insertSubmenu = db.prepare('INSERT INTO submenus (pageId, items) VALUES (?, ?)');
                for (const [pageId, items] of Object.entries(data.submenuConfig)) {
                    insertSubmenu.run(pageId, JSON.stringify(items));
                }
            }
            
            // Note: Since old passwords were SHA256, migrating them perfectly to Bcrypt is tricky.
            // We just set a new default bcrypt password for migrated admin.
            const newAdminHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123456', 10);
            const insertAdmin = db.prepare('INSERT INTO admins (username, passwordHash, roles, updatedAt) VALUES (?, ?, ?, ?)');
            insertAdmin.run('admin', newAdminHash, JSON.stringify(['admin']), new Date().toISOString());
        })();
        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Failure during migration:', e);
    }
} else if (isMigratedCheck.count === 0) {
    const defaultPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123456', 10);
    db.prepare('INSERT INTO admins (username, passwordHash, roles, updatedAt) VALUES (?, ?, ?, ?)').run(
        'admin', defaultPasswordHash, JSON.stringify(['admin']), new Date().toISOString()
    );
}

// Default submenus if still empty
const defaultSubmenus = {
    news: [
        { label: '新闻总览', to: '/news' },
        { label: '热点列表', to: '/news#news-list' },
        { label: 'AI 深度摘要', to: '/news#ai-analysis' }
    ],
    frameworks: [
        { label: 'AI 实践框架总览', to: '/frameworks' },
        { label: '已同步资料', to: '/frameworks#synced-materials' }
    ]
};

if (db.prepare('SELECT COUNT(*) as count FROM submenus').get().count === 0) {
    const insertSubmenu = db.prepare('INSERT INTO submenus (pageId, items) VALUES (?, ?)');
    db.transaction(() => {
        for (const [pageId, items] of Object.entries(defaultSubmenus)) {
            insertSubmenu.run(pageId, JSON.stringify(items));
        }
    })();
}

module.exports = db;
