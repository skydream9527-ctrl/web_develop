import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

export async function analyzeContent(content: string) {
    if (!API_KEY) {
        console.warn('GEMINI_API_KEY not found in environment variables. Returning mock analysis.');
        return "AI 分析预览：这是一篇关于人工智能领域最新进展的文章，涵盖了模型优化和行业应用。";
    }

    try {
        const response = await axios.post(`${API_URL}?key=${API_KEY}`, {
            contents: [{
                parts: [{
                    text: `请分析以下内容，提炼核心要点，生成简洁的摘要报告：\n\n${content}`
                }]
            }]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = response.data;
        if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts[0]) {
            return result.candidates[0].content.parts[0].text;
        }
        return "未能解析 AI 分析结果。";
    } catch (error: any) {
        console.error('Gemini API 调用失败:', error.message);
        return "AI 分析暂时不可用，请稍后再试。";
    }
}
