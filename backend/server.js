const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Helper to read data
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return { skills: [], posts: [], news: [], materials: [] };
        }
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(rawData);
        if (!data.materials) data.materials = [];
        return data;
    } catch (e) {
        console.error('Error reading data:', e);
        return { skills: [], posts: [], news: [], materials: [] };
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
