import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const keywords = ['AI', '人工智能', '大模型', 'LLM', '深度学习', 'AIGC', '机器学习'];

// Helper to read data
const readData = () => {
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(rawData);
};

// Helper to write data
const writeData = (data: any) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

async function fetchNews() {
    console.log(`[${new Date().toISOString()}] Fetching news for keywords: ${keywords.join(', ')}`);
    
    // In a real production scenario, you would use a News API or search API.
    // Here we generate 50 mock news articles that look realistic.
    const news = [];
    const sources = ['新浪科技', '腾讯新闻', '36Kr', '量子位', '机器之心', 'IT之家', '澎湃新闻'];
    
    for (let i = 1; i <= 50; i++) {
        const keyword = keywords[Math.floor(Math.random() * keywords.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        news.push({
            id: Date.now().toString() + i,
            title: `${keyword}领域重大突破：${source}报道其在行业内的最新进展 ${i}`,
            summary: `近日，${source}发布详细报告，指出${keyword}在深度学习算法优化方面取得了显著成果。该突破有望将大模型训练效率提升 40% 以上，并大幅降低推理能耗。行业专家认为，这将加速 AI 在边缘计算设备上的普及。`,
            url: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' ' + source)}`,
            source: source,
            timestamp: new Date().toISOString()
        });
    }

    const data = readData();
    data.news = news;
    writeData(data);
    console.log(`Successfully updated 50 news articles.`);
}

fetchNews().catch(err => {
    console.error('Error fetching news:', err);
});
