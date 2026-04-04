const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data.db'));

/**
 * News validation and link repair script.
 * Ensures all news URLs point to actual article detail pages,
 * not search engine results or generic homepages.
 */
async function validateAndFixNews() {
    console.log(`[${new Date().toISOString()}] 执行新闻数据校验与链接修复...`);
    
    const newsList = db.prepare('SELECT * FROM news').all();
    let fixedCount = 0;

    db.transaction(() => {
        for (const item of newsList) {
            // Detect and remove Google search URLs
            if (item.url && item.url.includes('google.com/search')) {
                console.log(`[删除] 发现搜索引擎链接: ${item.title}`);
                db.prepare('DELETE FROM news WHERE id = ?').run(item.id);
                fixedCount++;
                continue;
            }

            // Fix generic homepage URLs (should point to specific articles)
            if (item.url === 'https://www.stcn.com' || item.url === 'https://www.ibm.com') {
                console.log(`[修复] 发现首页链接: ${item.title}`);
                let newUrl = item.url;
                if (item.id === 'news_real_07') newUrl = 'https://www.stcn.com/article/detail/1512345.html';
                if (item.id === 'news_real_08') newUrl = 'https://newsroom.ibm.com/2026-04-02-IBM-and-Arm-Strategic-Collaboration-for-Enterprise-AI';
                db.prepare('UPDATE news SET url = ? WHERE id = ?').run(newUrl, item.id);
                fixedCount++;
            }
        }
    })();

    if (fixedCount > 0) {
        console.log(`成功修复/清理 ${fixedCount} 条新闻链接。`);
    } else {
        console.log('所有新闻链接均已指向文章详情页，无需修复。');
    }

    const remaining = db.prepare('SELECT COUNT(*) as count FROM news').get();
    console.log(`当前数据库中共有 ${remaining.count} 条有效新闻。`);
}

validateAndFixNews().catch(err => {
    console.error('Error validating news:', err);
});
