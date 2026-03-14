import { NextResponse } from "next/server";
import {
  getInventoryAnalysis,
  getRecommendationEngine,
  getSalesAnalysis,
  getTrendPrediction
} from "@/services/ai/ai-insight-service";

export async function GET() {
  return NextResponse.json({
    salesAnalysis: getSalesAnalysis(),
    inventoryHealth: getInventoryAnalysis(),
    trendForecast: getTrendPrediction(),
    recommendations: getRecommendationEngine()
  });
}
