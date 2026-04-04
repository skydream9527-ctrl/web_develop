const path = require('path');
const Database = require('better-sqlite3');
const Parser = require('rss-parser');

const db = new Database(path.join(__dirname, 'data.db'));
const parser = new Parser();

// Multiple fallback RSS feeds for AI / Tech news
const RSS_FEEDS = [
    'https://hnrss.org/newest?q=AI',
    'https://export.arxiv.org/rss/cs.AI',
    'https://techcrunch.com/category/artificial-intelligence/feed/',
];

/**
 * Fetch daily AI news using RSS and synchronize with database.
 */
async function fetchAndSyncNews() {
    console.log(`[${new Date().toISOString()}] 执行新闻数据抓取与同步...`);
    
    let allItems: any[] = [];
    
    for (const feedUrl of RSS_FEEDS) {
        try {
            console.log(`正在从 ${feedUrl} 抓取数据...`);
            const feed = await parser.parseURL(feedUrl);
            const items = feed.items.slice(0, 15).map(item => ({
                id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                title: item.title || '无标题新闻',
                url: item.link || '',
                source: feed.title || 'Tech News',
                summary: item.contentSnippet || item.content || '无摘要内容',
                timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
            }));
            allItems = allItems.concat(items);
        } catch (error: any) {
            console.error(`从 ${feedUrl} 抓取失败: ${error.message}`);
        }
    }
    
    console.log(`共抓取到 ${allItems.length} 条数据，准备去重入库...`);
    
    let addedCount = 0;
    
    db.transaction(() => {
        const checkStmt = db.prepare('SELECT COUNT(*) as count FROM news WHERE url = ?');
        const insertStmt = db.prepare('INSERT INTO news (id, title, url, source, summary, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
        
        for (const item of allItems) {
            // Skip invalid items
            if (!item.url || !item.url.startsWith('http')) continue;
            
            // Check for duplicates based on URL
            const existing = checkStmt.get(item.url) as { count: number };
            if (existing && existing.count === 0) {
                insertStmt.run(item.id, item.title, item.url, item.source, item.summary, item.timestamp);
                addedCount++;
            }
        }
    })();
    
    console.log(`成功新增了 ${addedCount} 条实时的 AI 新闻。`);
    
    const remaining = (db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number });
    console.log(`当前数据库中共有 ${remaining.count} 条有效新闻。`);
}

fetchAndSyncNews().catch(err => {
    console.error('Error fetching news:', err);
});
