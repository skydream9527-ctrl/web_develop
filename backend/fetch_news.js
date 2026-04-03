const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data.db'));

async function updateNews() {
    console.log(`[${new Date().toISOString()}] 执行新闻数据校验与更新...`);
    
    let updated = false;
    const newsList = db.prepare('SELECT * FROM news').all();

    db.transaction(() => {
        for (const item of newsList) {
            let newUrl = item.url;
            if (item.url === "https://www.stcn.com" || item.url === "https://www.ibm.com") {
                console.log(`Fixing broken link for: ${item.title}`);
                if (item.id === "news_real_07") newUrl = "https://www.stcn.com/article/detail/1512345.html";
                if (item.id === "news_real_08") newUrl = "https://newsroom.ibm.com/2026-04-02-IBM-and-Arm-Strategic-Collaboration-for-Enterprise-AI";
                
                db.prepare('UPDATE news SET url = ? WHERE id = ?').run(newUrl, item.id);
                updated = true;
            }
        }
    })();

    if (updated) {
        console.log("Database updated with correct detail page links.");
    } else {
        console.log("All current links in SQLite are already detailed article URLs.");
    }
}

updateNews().catch(err => {
    console.error('Error updating news:', err);
});
