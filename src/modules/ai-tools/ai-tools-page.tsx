import { aiInsights } from "@/mock";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import { AIAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { AIChartPanel } from "@/components/ai/ai-chart-panel";
import { AIRecommendationList } from "@/components/ai/ai-recommendation-list";
import { AIStatusWidget } from "@/components/ai/ai-status-widget";

export function AIToolsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {aiInsights.map((insight) => (
          <AIInsightCard key={insight.id} insight={insight} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AIChartPanel />
        <AIStatusWidget />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <AIRecommendationList />
        <AIAssistantPanel />
      </div>
    </div>
  );
}
