import { aiInsights } from "@/mock/ai-insights";

export function getSalesAnalysis() {
  return aiInsights.filter((insight) => insight.title.includes("Doanh số"));
}

export function getInventoryAnalysis() {
  return aiInsights.filter((insight) => insight.title.includes("Tồn kho"));
}

export function getTrendPrediction() {
  return aiInsights.filter((insight) => insight.title.includes("Xu hướng"));
}

export function getRecommendationEngine() {
  return aiInsights;
}
