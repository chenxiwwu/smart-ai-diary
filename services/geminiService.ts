
import { GoogleGenAI } from "@google/genai";
import { DayEntry } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateMyDaySummary = async (entry: DayEntry): Promise<string> => {
  if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY is not set");
    return "API Key 未配置";
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const todos = entry.todos.map(t => `- ${t.text}（${t.completed ? '已完成' : '未完成'}）`).join('\n');
  const expenses = entry.expenses.map(e => `- ${e.item}: ¥${e.amount}`).join('\n');
  const thoughts = entry.insight?.replace(/<[^>]*>/g, '').trim() || '无';

  const contentDescription = `
【待办事项】
${todos || '无'}

【今日开销】
${expenses || '无'}

【心情感悟】
${thoughts}
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `你是一个擅长捕捉生活细节的日记助手。请根据用户今天的记录，生成一句"今日总结"。

要求：
1. 不超过25个字
2. 不要面面俱到，抓住最能代表今天的一个记忆点或情绪点
3. 语言风格随内容自由发挥：可以幽默吐槽、温暖治愈、文艺感性、或犀利点评
4. 像朋友聊天一样自然，不要官方和套话
5. 只返回总结文字本身，不要加引号、标点符号结尾、或任何解释

用户今日记录：
${contentDescription}`,
    });

    return response.text?.trim().slice(0, 30) || '今天也是平凡又特别的一天';
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    if (error?.message?.includes('429') || error?.status === 429) {
      return 'API 调用次数已达上限，请稍后再试';
    }
    return '生成失败，请稍后重试';
  }
};
