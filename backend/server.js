const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const multer = require('multer');
const fs = require('fs');
const { processAndStoreEmbeddings, queryRAG } = require('./rag');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: '登录尝试次数过多，请 10 分钟后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

const sanitizeSubmenuItems = (items) => {
    if (!Array.isArray(items)) return null;
    const normalized = items
        .map((item) => ({
            label: typeof item?.label === 'string' ? item.label.trim() : '',
            to: typeof item?.to === 'string' ? item.to.trim() : ''
        }))
        .filter((item) => item.label && item.to && (item.to.startsWith('/') || item.to.startsWith('http://') || item.to.startsWith('https://')));
    return normalized.length ? normalized : null;
};

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- Settings API (Public & Admin) ---
app.get('/api/settings', (req, res) => {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const config = {};
    for (const row of rows) {
        try { config[row.key] = JSON.parse(row.value); } 
        catch { config[row.key] = row.value; }
    }
    res.json(config);
});

app.put('/api/admin/settings', requireAdminAuth, (req, res) => {
    const payload = req.body || {};
    if (!req.adminRoles.includes('admin')) return res.status(403).json({ error: '权限不足' });
    
    db.transaction(() => {
        const checkStmt = db.prepare('SELECT COUNT(*) as count FROM settings WHERE key = ?');
        const updateStmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
        const insertStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        for (const [k, v] of Object.entries(payload)) {
            const valStr = JSON.stringify(v);
            if (checkStmt.get(k).count > 0) {
                updateStmt.run(valStr, k);
            } else {
                insertStmt.run(k, valStr);
            }
        }
    })();
    res.json({ ok: true });
});


// Get all submenus mapping (Legacy Support for frontend temporarily)
function getAllSubmenus() {
    const rows = db.prepare('SELECT pageId, items FROM submenus').all();
    const config = {};
    for (const row of rows) {
        try {
            config[row.pageId] = JSON.parse(row.items);
        } catch {
            config[row.pageId] = [];
        }
    }
    return config;
}

app.get('/api/submenus', (req, res) => {
    res.json(getAllSubmenus());
});

app.post('/api/admin/login', loginLimiter, (req, res) => {
    const { username, password } = req.body || {};
    const targetUsername = username ? username : 'admin';
    const adminUser = db.prepare('SELECT * FROM admins WHERE username = ?').get(targetUsername);

    if (adminUser && password && bcrypt.compareSync(password, adminUser.passwordHash)) {
        let roles = ['admin'];
        try { roles = JSON.parse(adminUser.roles); } catch {}
        
        const token = jwt.sign({ username: targetUsername, roles }, JWT_SECRET, { expiresIn: '12h' });
        return res.json({ token, expiresInMs: 12 * 60 * 60 * 1000, username: targetUsername, roles });
    }

    return res.status(401).json({ error: '用户名或密码错误' });
});

app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
    res.json({ ok: true });
});

app.get('/api/admin/me', requireAdminAuth, (req, res) => {
    res.json({ username: req.adminUsername || '', roles: req.adminRoles || [] });
});

app.get('/api/admin/submenus', requireAdminAuth, (req, res) => {
    res.json(getAllSubmenus());
});

app.put('/api/admin/submenus/:pageId', requireAdminAuth, (req, res) => {
    const pageId = (req.params.pageId || '').trim();
    const normalizedItems = sanitizeSubmenuItems(req.body?.items);
    if (!pageId || !normalizedItems) {
        return res.status(400).json({ error: 'pageId 或 items 无效' });
    }
    const roles = req.adminRoles || [];
    if (!roles.includes('admin') && !roles.includes('editor')) {
        return res.status(403).json({ error: '权限不足，需 editor 或 admin 角色' });
    }
    
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM submenus WHERE pageId = ?').get(pageId);
    if (checkStmt.count > 0) {
        db.prepare('UPDATE submenus SET items = ? WHERE pageId = ?').run(JSON.stringify(normalizedItems), pageId);
    } else {
        db.prepare('INSERT INTO submenus (pageId, items) VALUES (?, ?)').run(pageId, JSON.stringify(normalizedItems));
    }
    
    return res.json({ pageId, items: normalizedItems });
});

app.put('/api/admin/password', requireAdminAuth, (req, res) => {
    const { oldPassword, newPassword } = req.body || {};
    if (!req.adminRoles.includes('admin')) {
        return res.status(403).json({ error: '权限不足，需 admin 角色' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
        return res.status(400).json({ error: '新密码至少 6 位' });
    }

    const adminUser = db.prepare('SELECT passwordHash FROM admins WHERE username = ?').get(req.adminUsername);
    if (!adminUser || !bcrypt.compareSync(oldPassword, adminUser.passwordHash)) {
        return res.status(401).json({ error: '旧密码错误' });
    }

    const newHash = bcrypt.hashSync(newPassword.trim(), 10);
    db.prepare('UPDATE admins SET passwordHash = ?, updatedAt = ? WHERE username = ?').run(
        newHash, new Date().toISOString(), req.adminUsername
    );
    return res.json({ ok: true, message: '密码更新成功，请重新登录' });
});

function requireAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Session expired' });
        }
        req.adminUsername = decoded.username;
        req.adminRoles = decoded.roles || [];
        next();
    });
}

// --- Dynamic Menus API ---
app.get('/api/menus', (req, res) => {
    const menus = db.prepare('SELECT * FROM menus ORDER BY sort_order ASC').all();
    res.json(menus);
});

// --- Dynamic Contents API ---
app.get('/api/contents', (req, res) => {
    const { menu_id } = req.query;
    let query = 'SELECT * FROM contents';
    let params = [];
    if (menu_id) {
        query += ' WHERE menu_id = ?';
        params.push(menu_id);
    }
    query += ' ORDER BY sort_order ASC, created_at DESC';
    const contents = db.prepare(query).all(...params);
    
    const results = contents.map(c => {
        try {
            return { ...c, meta: JSON.parse(c.meta || '{}') };
        } catch {
            return { ...c, meta: {} };
        }
    });
    res.json(results);
});

app.post('/api/admin/contents', requireAdminAuth, (req, res) => {
    if (!req.adminRoles.includes('admin') && !req.adminRoles.includes('editor')) {
        return res.status(403).json({ error: '权限不足' });
    }
    const { menu_id, title, type, body, meta, sort_order } = req.body;
    try {
        const result = db.prepare('INSERT INTO contents (menu_id, title, type, body, meta, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
            .run(menu_id || 0, title || '未命名', type || 'richtext', body || '', JSON.stringify(meta || {}), sort_order || 0);
        
        // Trigger embedding generation in background if body exists
        if (body) {
            processAndStoreEmbeddings(`content_${result.lastInsertRowid}`, body).catch(e => console.error("Embedding Error:", e));
        }
            
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/contents/:id', requireAdminAuth, (req, res) => {
    if (!req.adminRoles.includes('admin') && !req.adminRoles.includes('editor')) {
        return res.status(403).json({ error: '权限不足' });
    }
    const { menu_id, title, type, body, meta, sort_order } = req.body;
    try {
        db.prepare('UPDATE contents SET menu_id = ?, title = ?, type = ?, body = ?, meta = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(menu_id || 0, title, type, body, JSON.stringify(meta || {}), sort_order || 0, req.params.id);
            
        if (body) {
            processAndStoreEmbeddings(`content_${req.params.id}`, body).catch(e => console.error("Embedding Error:", e));
        }

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/contents/:id', requireAdminAuth, (req, res) => {
    if (!req.adminRoles.includes('admin') && !req.adminRoles.includes('editor')) {
        return res.status(403).json({ error: '权限不足' });
    }
    try {
        db.prepare('DELETE FROM contents WHERE id = ?').run(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MATERIAL STORAGE & UPLOAD ---
app.post('/api/upload', upload.single('file'), (req, res) => {
    // If it's a real file upload via multer
    let fileUrl = '';
    if (req.file) {
        fileUrl = `/uploads/${req.file.filename}`;
    }

    // fallback mapping if it's sent as JSON (for backward compatibility)
    const bodyContent = req.body.content || fileUrl;
    const isFolderFlag = req.body.isFolder === 'true' || req.body.isFolder === true;
    const fileCountVal = parseInt(req.body.fileCount, 10) || 1;
    const nameVal = req.body.name || (req.file ? req.file.originalname : '未命名资料');

    const newMaterial = {
        id: Date.now().toString(),
        name: nameVal,
        module: req.body.module || 'frameworks',
        timestamp: new Date().toISOString(),
        isFolder: isFolderFlag ? 1 : 0,
        fileCount: fileCountVal,
        content: bodyContent
    };
    
    try {
        db.prepare('INSERT INTO materials (id, name, module, timestamp, isFolder, fileCount, content) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            newMaterial.id, newMaterial.name, newMaterial.module, newMaterial.timestamp, newMaterial.isFolder, newMaterial.fileCount, newMaterial.content
        );

        // Process pure textual representations implicitly provided during upload if any.
        // E.g. Markdown or txt file contents that we might have received.
        if (!fileUrl && bodyContent && typeof bodyContent === 'string' && bodyContent.length > 50 && !bodyContent.startsWith('data:')) {
            processAndStoreEmbeddings(`material_${newMaterial.id}`, bodyContent).catch(e => console.error("Embedding Error:", e));
        }

        res.status(201).json({
            ...newMaterial,
            isFolder: !!newMaterial.isFolder
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/materials/:module', (req, res) => {
    const module = req.params.module;
    const materials = db.prepare('SELECT id, name, module, timestamp, isFolder, fileCount FROM materials WHERE module = ? ORDER BY timestamp DESC').all(module);
    
    const results = materials.map(m => ({
        ...m,
        isFolder: m.isFolder === 1
    }));
    
    res.json(results);
});

app.get('/api/materials/detail/:id', (req, res) => {
    const id = req.params.id;
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
    if (!material) {
        return res.status(404).json({ error: 'Material not found' });
    }
    res.json({
        ...material,
        isFolder: material.isFolder === 1
    });
});

app.post('/api/materials/analyze/:id', async (req, res) => {
    const id = req.params.id;
    const material = db.prepare('SELECT content FROM materials WHERE id = ?').get(id);
    
    if (!material || !material.content) {
        return res.json({ analysis: "无法生成摘要：文件内容为空或不支持此类文件格式。" });
    }

    if (material.content.startsWith('data:')) {
        return res.json({ analysis: "AI 摘要目前仅支持文本。PDF/PPT 资料请下载后阅读。" });
    }

    try {
        const response = await axios.post(
            'https://api.minimax.chat/v1/text/chatcompletion_v2',
            {
                model: 'minimax-2.7',
                messages: [
                    { role: 'system', content: '你是一个专业的 AI 资料分析助手。请对用户提供内容进行摘要。' },
                    { role: 'user', content: `分析以下资料：\n\n${material.content.substring(0, 4000)}` }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const analysis = response.data.choices[0]?.message?.content || "无摘要。";
        res.json({ analysis });
    } catch (error) {
        res.status(500).json({ error: 'AI 分析不可用' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: '消息为空' });

    try {
        const answer = await queryRAG(message);
        res.json({ answer });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/skills', (req, res) => {
    const skills = db.prepare('SELECT * FROM skills').all();
    res.json(skills);
});

app.post('/api/skills', (req, res) => {
    const { name, description, category } = req.body;
    const id = Date.now().toString();
    db.prepare('INSERT INTO skills (id, name, description, category) VALUES (?, ?, ?, ?)').run(id, name, description, category);
    res.status(201).json({ id, name, description, category });
});

app.get('/api/skills/:id/posts', (req, res) => {
    const posts = db.prepare('SELECT * FROM posts WHERE skillId = ? ORDER BY timestamp DESC').all(req.params.id);
    res.json(posts);
});

app.get('/api/news', (req, res) => {
    const newsList = db.prepare('SELECT * FROM news ORDER BY timestamp DESC').all();
    res.json(newsList);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
