const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const adminSessions = new Map();
const DEFAULT_SUBMENU_CONFIG = {
    news: [
        { label: '新闻总览', to: '/news' },
        { label: '热点列表', to: '/news#news-list' },
        { label: 'AI 深度摘要', to: '/news#ai-analysis' }
    ],
    frameworks: [
        { label: 'AI 实践框架总览', to: '/frameworks' },
        { label: '已同步资料', to: '/frameworks#synced-materials' },
        { label: '推荐实践案例', to: '/frameworks#practice-cases' }
    ],
    agents: [
        { label: 'AI Agent 总览', to: '/agents' },
        { label: 'GitHub TOP10', to: '/agents#github-top10' },
        { label: '已同步资料', to: '/agents#synced-materials' },
        { label: '推荐实践案例', to: '/agents#practice-cases' }
    ],
    skills: [
        { label: 'AI Skill 总览', to: '/skills' },
        { label: 'GitHub TOP10', to: '/skills#github-top10' },
        { label: '已同步资料', to: '/skills#synced-materials' },
        { label: '推荐实践案例', to: '/skills#practice-cases' }
    ],
    knowledge: [
        { label: 'AI 知识库总览', to: '/knowledge' },
        { label: '已同步资料', to: '/knowledge#synced-materials' },
        { label: '推荐实践案例', to: '/knowledge#practice-cases' }
    ],
    materials: [
        { label: '学习资料总览', to: '/materials' },
        { label: '已同步资料', to: '/materials#synced-materials' },
        { label: '推荐实践案例', to: '/materials#practice-cases' }
    ],
    tools: [
        { label: '好用工具总览', to: '/tools' },
        { label: '已同步资料', to: '/tools#synced-materials' },
        { label: '推荐实践案例', to: '/tools#practice-cases' }
    ],
    apps: [
        { label: 'APP 开发总览', to: '/apps' },
        { label: '已同步资料', to: '/apps#synced-materials' },
        { label: '推荐实践案例', to: '/apps#practice-cases' }
    ],
    webs: [
        { label: '网页开发总览', to: '/webs' },
        { label: '已同步资料', to: '/webs#synced-materials' },
        { label: '推荐实践案例', to: '/webs#practice-cases' }
    ]
};

const hashPassword = (password = '') => crypto.createHash('sha256').update(password).digest('hex');

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

const normalizeData = (raw = {}) => {
    const data = { ...raw };
    let changed = false;
    if (!Array.isArray(data.skills)) {
        data.skills = [];
        changed = true;
    }
    if (!Array.isArray(data.posts)) {
        data.posts = [];
        changed = true;
    }
    if (!Array.isArray(data.news)) {
        data.news = [];
        changed = true;
    }
    if (!Array.isArray(data.materials)) {
        data.materials = [];
        changed = true;
    }
    if (!data.submenuConfig || typeof data.submenuConfig !== 'object' || Array.isArray(data.submenuConfig)) {
        data.submenuConfig = { ...DEFAULT_SUBMENU_CONFIG };
        changed = true;
    }
    if (!data.admin || typeof data.admin !== 'object' || Array.isArray(data.admin)) {
        data.admin = { passwordHash: hashPassword(ADMIN_PASSWORD), updatedAt: new Date().toISOString() };
        changed = true;
    }
    if (!data.admin.passwordHash) {
        data.admin.passwordHash = hashPassword(ADMIN_PASSWORD);
        data.admin.updatedAt = new Date().toISOString();
        changed = true;
    }
    if (!Array.isArray(data.admins)) {
        data.admins = [
            { username: 'admin', passwordHash: hashPassword(ADMIN_PASSWORD), roles: ['admin'], updatedAt: new Date().toISOString() }
        ];
        changed = true;
    }
    return { data, changed };
};

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/submenus', (req, res) => {
    const data = readData();
    res.json(data.submenuConfig || DEFAULT_SUBMENU_CONFIG);
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {};
    const data = readData();
    let roles = [];
    let loginOk = false;
    let resolvedUsername = '';
    if (username && password) {
        const found = (data.admins || []).find((u) => u.username === username);
        if (found && hashPassword(password) === found.passwordHash) {
            roles = Array.isArray(found.roles) ? found.roles : ['admin'];
            loginOk = true;
            resolvedUsername = username;
        }
    } else if (password && hashPassword(password) === data.admin.passwordHash) {
        roles = ['admin'];
        loginOk = true;
        resolvedUsername = 'admin';
    }
    if (!loginOk) {
        return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, { createdAt: Date.now(), expiresAt: Date.now() + ADMIN_TOKEN_TTL_MS, username: resolvedUsername, roles });
    return res.json({ token, expiresInMs: ADMIN_TOKEN_TTL_MS, username: resolvedUsername, roles });
});

app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
    adminSessions.delete(req.adminToken);
    res.json({ ok: true });
});

app.get('/api/admin/me', requireAdminAuth, (req, res) => {
    res.json({ username: req.adminUsername || '', roles: req.adminRoles || [] });
});

app.get('/api/admin/submenus', requireAdminAuth, (req, res) => {
    const data = readData();
    res.json(data.submenuConfig || DEFAULT_SUBMENU_CONFIG);
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
    const data = readData();
    data.submenuConfig[pageId] = normalizedItems;
    writeData(data);
    return res.json({ pageId, items: normalizedItems });
});

app.put('/api/admin/password', requireAdminAuth, (req, res) => {
    const { oldPassword, newPassword } = req.body || {};
    const roles = req.adminRoles || [];
    if (!roles.includes('admin')) {
        return res.status(403).json({ error: '权限不足，需 admin 角色' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
        return res.status(400).json({ error: '新密码至少 6 位' });
    }
    const data = readData();
    if (!oldPassword || hashPassword(oldPassword) !== data.admin.passwordHash) {
        return res.status(401).json({ error: '旧密码错误' });
    }
    data.admin.passwordHash = hashPassword(newPassword.trim());
    data.admin.updatedAt = new Date().toISOString();
    writeData(data);
    adminSessions.delete(req.adminToken);
    return res.json({ ok: true, message: '密码更新成功，请重新登录' });
});

// Helper to read data
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return normalizeData({}).data;
        }
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(rawData);
        const { data, changed } = normalizeData(parsed);
        if (changed) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        }
        return data;
    } catch (e) {
        console.error('Error reading data:', e);
        return normalizeData({}).data;
    }
};

// Helper to write data
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error writing data:', e);
    }
};

const pruneExpiredSessions = () => {
    const now = Date.now();
    for (const [token, session] of adminSessions.entries()) {
        if (session.expiresAt <= now) {
            adminSessions.delete(token);
        }
    }
};

const requireAdminAuth = (req, res, next) => {
    pruneExpiredSessions();
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token || !adminSessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const session = adminSessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
        adminSessions.delete(token);
        return res.status(401).json({ error: 'Session expired' });
    }
    req.adminToken = token;
    req.adminUsername = session.username;
    req.adminRoles = session.roles || [];
    return next();
};

// --- MATERIAL STORAGE & UPLOAD ---
app.post('/api/upload', (req, res) => {
    const { name, module, isFolder, files, content } = req.body;
    const data = readData();
    if (!data.materials) data.materials = [];
    
    const newMaterial = {
        id: Date.now().toString(),
        name: name || (files && files[0]?.name),
        module: module || 'frameworks',
        timestamp: new Date().toISOString(),
        isFolder: !!isFolder,
        fileCount: files ? files.length : 1,
        content: content || ''
    };
    
    data.materials.push(newMaterial);
    writeData(data);
    res.status(201).json(newMaterial);
});

// Get materials by module
app.get('/api/materials/:module', (req, res) => {
    const module = req.params.module;
    const data = readData();
    const materials = (data.materials || []).filter((m) => m.module === module);
    res.json(materials);
});

// Get individual material
app.get('/api/materials/detail/:id', (req, res) => {
    const id = req.params.id;
    const data = readData();
    const material = (data.materials || []).find((m) => m.id === id);
    if (!material) {
        return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
});

// AI Analyze Material using MiniMax
app.post('/api/materials/analyze/:id', async (req, res) => {
    const id = req.params.id;
    const data = readData();
    const material = (data.materials || []).find((m) => m.id === id);
    
    if (!material) {
        return res.status(404).json({ error: 'Material not found' });
    }

    if (!material.content) {
        return res.json({ analysis: "无法生成摘要：文件内容为空或不支持此类文件格式。" });
    }

    if (material.content.startsWith('data:')) {
        return res.json({ analysis: "AI 摘要目前仅支持文本和 Markdown 格式。PDF/PPT 资料请下载后阅读。" });
    }

    try {
        const response = await axios.post(
            'https://api.minimax.chat/v1/text/chatcompletion_v2',
            {
                model: 'minimax-2.7',
                messages: [
                    { role: 'system', content: '你是一个专业的 AI 资料分析助手。请对用户提供的资料内容进行简洁、精准的摘要分析。' },
                    { role: 'user', content: `请分析以下资料并生成简短摘要：\n\n${material.content.substring(0, 4000)}` }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const analysis = response.data.choices[0]?.message?.content || "分析完成，但未生成内容。";
        res.json({ analysis });
    } catch (error) {
        console.error('MiniMax API Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'AI 分析服务暂时不可用' });
    }
});

// Get all skills
app.get('/api/skills', (req, res) => {
    const data = readData();
    res.json(data.skills);
});

// Add a new skill
app.post('/api/skills', (req, res) => {
    const { name, description, category } = req.body;
    const data = readData();
    const newSkill = {
        id: Date.now().toString(),
        name,
        description,
        category
    };
    data.skills.push(newSkill);
    writeData(data);
    res.status(201).json(newSkill);
});

// Get posts for a specific skill
app.get('/api/skills/:id/posts', (req, res) => {
    const skillId = req.params.id;
    const data = readData();
    const skillPosts = data.posts.filter((p) => p.skillId === skillId);
    res.json(skillPosts);
});

// Get all news
app.get('/api/news', (req, res) => {
    const data = readData();
    res.json(data.news);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
