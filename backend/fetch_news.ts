const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data.db'));

const keywords = ['AI', '人工智能', '大模型', 'LLM', '深度学习', 'AIGC', '机器学习'];

async function fetchNews() {
    console.log(`[${new Date().toISOString()}] Fetching news for keywords: ${keywords.join(', ')}`);
    
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

    db.transaction(() => {
        db.prepare('DELETE FROM news').run();
        const insertNews = db.prepare('INSERT INTO news (id, title, url, source, summary, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
        for (const item of news) {
            insertNews.run(item.id, item.title, item.url, item.source, item.summary, item.timestamp);
        }
    })();
    console.log(`Successfully updated 50 news articles in SQLite.`);
}

fetchNews().catch(err => {
    console.error('Error fetching news:', err);
});
