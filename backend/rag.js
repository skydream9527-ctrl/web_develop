const axios = require('axios');
const path = require('path');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');

dotenv.config();

const db = new Database(path.join(__dirname, 'data.db'));
const API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
const GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Helper: Cosine Similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fetch embedding for a single text
async function getEmbedding(text) {
  if (!API_KEY) {
      console.warn("GEMINI_API_KEY missing. Embedding generation skipped.");
      return null;
  }
  try {
      const response = await axios.post(`${EMBEDDING_URL}?key=${API_KEY}`, {
          model: "models/text-embedding-004",
          content: {
              parts: [{ text }]
          }
      }, { headers: { 'Content-Type': 'application/json' } });
      
      const values = response.data?.embedding?.values;
      if (!values) throw new Error("Invalid embedding response");
      return values;
  } catch (err) {
      console.error("Embedding API Error:", err.message);
      return null;
  }
}

// Split text into overlapping chunks
function chunkText(text, maxLen = 800, overlap = 100) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        let end = start + maxLen;
        if (end > text.length) end = text.length;
        chunks.push(text.slice(start, end));
        start += (maxLen - overlap);
    }
    return chunks;
}

// Process and store document embeddings
async function processAndStoreEmbeddings(refId, text) {
    if (!text || text.length < 50) return; // Too short to matter
    
    // Clear old embeddings for this refId if any
    db.prepare('DELETE FROM embeddings WHERE ref_id = ?').run(refId);

    const chunks = chunkText(text);
    const insertStmt = db.prepare('INSERT INTO embeddings (id, ref_id, chunk_text, embedding_json) VALUES (?, ?, ?, ?)');

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const vector = await getEmbedding(chunk);
        if (vector) {
            insertStmt.run(
                `emb_${Date.now()}_${i}`,
                refId,
                chunk,
                JSON.stringify(vector)
            );
        }
        // Small delay to prevent rate limits
        await new Promise(r => setTimeout(r, 200));
    }
    console.log(`[RAG] Stored ${chunks.length} embeddings for ${refId}`);
}

// Chat with RAG
async function queryRAG(userQuery) {
    const queryVector = await getEmbedding(userQuery);
    if (!queryVector) {
        return "抱歉，向量配置未完成或缺乏 API KEY，无法进行智能搜索。";
    }

    // Load all embeddings and calculate similarity
    const allEmbeddings = db.prepare('SELECT id, ref_id, chunk_text, embedding_json FROM embeddings').all();
    
    let scoredChunks = [];
    for (const row of allEmbeddings) {
        try {
            const vec = JSON.parse(row.embedding_json);
            const score = cosineSimilarity(queryVector, vec);
            scoredChunks.push({ ...row, score });
        } catch(e) {}
    }

    // Sort by descending similarity and pick top 5
    scoredChunks.sort((a, b) => b.score - a.score);
    const topK = scoredChunks.slice(0, 5);
    
    const contextText = topK.map((c, i) => `【资料引用 ${i+1}】(引用ID: ${c.ref_id}):\n${c.chunk_text}`).join('\n\n');

    const prompt = `你是一个个人知识库的智能助理。请基于以下提供的参考资料，回答用户的提问。\n\n参考资料：\n${contextText}\n\n用户提问：${userQuery}\n\n要求：\n1. 请准确回答，切勿胡编乱造。\n2. 如果资料中未提供足够信息，请如实回答“暂未在知识库中找到相关信息”。\n3. 如果适合，请在回答末尾简要提及资料来源。`;

    if (!API_KEY) return "AI 对话暂不可用";
    try {
        const response = await axios.post(`${GENERATE_URL}?key=${API_KEY}`, {
            contents: [{ parts: [{ text: prompt }] }]
        }, { headers: { 'Content-Type': 'application/json' } });
        
        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "生成的回答为空。";
    } catch(err) {
        console.error("Gemini Generate Error:", err.message);
        return "AI 分析失败，请稍后重试。";
    }
}

module.exports = {
    processAndStoreEmbeddings,
    queryRAG
};
