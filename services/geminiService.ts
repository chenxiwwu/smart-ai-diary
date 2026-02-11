import { DayEntry } from "../types";
import { api } from "./api";

export const generateMyDaySummary = async (entry: DayEntry): Promise<string> => {
  try {
    const result = await api.generateSummary(entry);
    return result.summary;
  } catch (error: any) {
    console.error("AI summary error:", error);
    if (error?.message?.includes('429') || error?.status === 429) {
      return 'API 调用次数已达上限，请稍后再试';
    }
    return '生成失败，请稍后重试';
  }
};
