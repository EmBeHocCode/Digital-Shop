# 🤖 Bot Zalo ↔️ Digital-Shop Integration Plan

## 📊 Overview

**bot-zalo** (Meow - Zalo AI Bot) là một **chatbot multi-functional** powered by Gemini 2.5 Flash. Có thể tích hợp với Digital-Shop để tạo:
- ✅ **CSKH Bot** - Hỗ trợ khách hàng qua Zalo
- ✅ **Inventory Optimizer** - Tối ưu tồn kho
- ✅ **Profit Analyzer** - Phân tích lợi nhuận real-time
- ✅ **Trend Forecaster** - Dự báo xu hướng thị trường

---

## 🏗️ Hiện Tại Bot-Zalo Có Gì?

### **Tech Stack**
```
Bot Core:        Bun + TypeScript + zca-js (Zalo client)
AI Engine:       Google Gemini 2.5 Flash (chat) + Groq (background tasks)
Database:        SQLite + Drizzle ORM (migrations)
Message Queue:   RxJS (buffer messages, streaming)
HTTP Server:     Hono (lightweight API framework)
Web Dashboard:   Next.js 16 + React 19 + TailwindCSS
Package Manager: Bun Workspaces (monorepo)
```

### **Current Capabilities**
- 🟢 **50+ Tools** across 9 modular plugins
- 🟢 **Real-time Zalo messaging** (WebSocket)
- 🟢 **Message buffering** (RxJS - combines 2.5s messages)
- 🟢 **Background scheduling** (Cron-based Groq agent)
- 🟢 **Long-term memory** (Vector embeddings + time decay)
- 🟢 **Web dashboard** (Settings, stats, logs, history)
- 🟢 **Cloud backup/restore** (GitHub Gist integration)

### **Existing Modules**
| Module | Tools Count | Purpose |
|--------|------------|---------|
| **Gateway** | 5 | Message routing & classification |
| **Chat** | 8 | Conversation history & memory |
| **System** | 3 | QR code, URL shortener |
| **Search** | 8 | Google, YouTube, Weather, Steam, Currency |
| **Media** | 6 | Charts, TTS, images, files |
| **Social** | 12 | User info, groups, polls, reminders |
| **Task** | 4 | Code execution, math, scheduling |
| **Academic** | 2 | TVU portal integration |
| **Entertainment** | 2 | Anime/Manga (Jikan), GIFs |
| **Background Agent** | 1 | Cron scheduler |
| **TOTAL** | **50+** | ✅ Highly modular & extensible |

---

## 🎯 Phase 1: CSKH Bot (Week 1-2)

### **What It Will Do**
```
Customer → Zalo → Bot → Digital-Shop API → Response
  
Examples:
- "Có áo xanh size M không?" → Bot lists products
- "Order #123 đâu rồi?" → Show tracking status
- "Tôi muốn hoàn lại" → Initiate refund
- "Có gì mới không?" → Recommend products
```

### **New Module: EcomCskhModule**

**Tools to Create:**
```typescript
export class EcomCskhModule extends BaseModule {
  private _tools: ITool[] = [
    // Search & Browsing
    searchProductsTool({
      keyword: string,
      category?: string,
      priceRange?: [min, max],
      page?: number
    }) → Returns 5-10 matching products with price, rating, thumbnail
    
    getProductDetailsTool({
      productId: string
    }) → Returns full product info: images, specs, reviews, inventory
    
    // Orders & Support
    checkOrderStatusTool({
      userId: string,
      orderId?: string
    }) → Returns order status, tracking, delivery date
    
    getOrderHistoryTool({
      userId: string,
      limit?: number
    }) → Returns user's past orders (sortable, filterable)
    
    createSupportTicketTool({
      userId: string,
      subject: string,
      description: string,
      attachments?: File[]
    }) → Log complaint, return ticket ID
    
    processRefundTool({
      orderId: string,
      reason: string,
      refundPercentage?: number
    }) → Initiate refund, return status
    
    // Additional
    getProductReviewsTool({
      productId: string,
      limit?: number
    }) → Reviews from other customers
    
    calculateShippingTool({
      province: string,
      weight: number
    }) → Shipping cost & estimated delivery
  ];
}
```

### **API Endpoints Needed (in Digital-Shop backend)**

```
GET  /api/ecom/products?q=keyword&category=&priceMin=&priceMax=&page=
GET  /api/ecom/products/:productId
GET  /api/ecom/products/:productId/reviews
GET  /api/ecom/orders/:orderId
GET  /api/ecom/user/:userId/orders?limit=&offset=
POST /api/ecom/orders/:orderId/refund {reason, percentage}
POST /api/ecom/support/tickets {userId, subject, description}
GET  /api/ecom/shipping-cost {province, weight}
```

### **Sample Conversation Flow**

```
User: "Tôi muốn mua VPS"
Bot: 
  1. searchProductsTool("VPS")
  2. Shows:
     📦 VPS 1GB - $5/mo ⭐4.8 | 342 reviews
     📦 VPS 2GB - $10/mo ⭐4.9 | 521 reviews
     📦 VPS 4GB - $20/mo ⭐4.7 | 198 reviews
  3. "Chọn cái nào? Gõ tên hoặc số"

User: "VPS 2GB"
Bot:
  1. getProductDetailsTool(vps-2gb)
  2. Shows full details: specs, images, reviews
  3. "Mua cái này không? Gõ 'mua' để tiếp tục"

User: "mua"
Bot:
  1. Asks for delivery address
  2. calculateShippingTool
  3. Creates order
  4. Returns order ID & tracking info

User: "Order #XYZ đâu rồi?"
Bot:
  1. checkOrderStatusTool(XYZ)
  2. Shows status: "Đang giao (2-3 ngày nữa)"
```

### **Implementation Checklist**

- [ ] Create `/apps/bot/src/modules/ecom/` folder
- [ ] Implement 8 tools above
- [ ] Add product embeddings for smart search
- [ ] Integrate with Digital-Shop API
- [ ] Test with 5-10 sample customers
- [ ] Deploy to production
- [ ] Monitor logs & performance
- [ ] Gather feedback, iterate

**Effort:** 7-10 days | **Team:** 1 Backend Dev + 1 QA

---

## 🔄 Phase 2: Inventory Optimization (Week 3)

### **What It Will Do**

```
Bot Monitor → Analyze Inventory → Predict Demand → Alert Admin via Zalo

Examples:
- ⚠️ Alert: "VPS 1GB stock low (5 units). Forecast: 20/week"
- ⚠️ Alert: "Product XYZ dead stock. 0 sold in 90 days"
- ✅ Recommendation: "Restock VPS 2GB. Demand up 40%, lead time 5 days"
- 📊 Report: "Top movers: VPS 2GB (+120% vs last month)"
```

### **New Module: InventoryOptimizationModule**

**Tools to Create:**
```typescript
export class InventoryOptimizationModule extends BaseModule {
  private _tools: ITool[] = [
    // Monitoring
    checkStockLevelsTool() → Real-time inventory for all products
    
    getProductVelocityTool({
      productId: string,
      days: number = 30
    }) → Sales velocity (units/day)
    
    analyzeSlowMovingTool({
      threshold: number = 0  // 0 sales in X days
    }) → Find dead stock products
    
    // Prediction
    predictDemandTool({
      productId: string,
      forecastDays: number = 30
    }) → AI forecast next 30 days demand
    
    // Recommendations
    suggestRestockTool() → Smart restock recommendations for all products
    
    compareSupplierPricesTool({
      productId: string
    }) → Find best supplier price
  ];
}
```

### **Database Schema Additions**

```sql
-- Track inventory changes
CREATE TABLE ecom_inventory_history (
  id INTEGER PRIMARY KEY,
  productId TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previousQuantity INTEGER,
  changeReason TEXT, -- 'sale', 'restock', 'adjustment', 'return'
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(productId) REFERENCES products(id)
);

-- Store demand forecasts
CREATE TABLE ecom_forecasts (
  id INTEGER PRIMARY KEY,
  productId TEXT NOT NULL,
  forecastDate DATE,
  demandForecast INTEGER,
  confidence REAL, -- 0-100%
  actualDemand INTEGER, -- filled after the day
  model TEXT, -- 'velocity', 'seasonal', 'ml'
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(productId) REFERENCES products(id)
);

-- Restock alerts
CREATE TABLE ecom_restock_alerts (
  id INTEGER PRIMARY KEY,
  productId TEXT NOT NULL,
  currentStock INTEGER,
  forecastedDemand INTEGER,
  recommendedRestock INTEGER,
  supplierId TEXT,
  costPerUnit DECIMAL(10, 2),
  totalRestockCost DECIMAL(10, 2),
  urgencyLevel TEXT, -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'pending', -- 'pending', 'ordered', 'received'
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(productId) REFERENCES products(id)
);
```

### **Algorithm: Demand Prediction**

```javascript
// Run daily at 2 AM via Groq background agent
cronExpression: "0 2 * * *"

function predictDemand(product, lastDays=90) {
  // Step 1: Calculate velocity (units/day)
  const salesHistory = getSalesData(product.id, lastDays);
  const velocity = calculateVelocity(salesHistory);
  
  // Step 2: Detect seasonality (if weekend/weekday/monthly pattern)
  const seasonalFactor = detectSeasonality(salesHistory, forecastDate);
  
  // Step 3: Trend (up/down/flat)
  const trend = calculateTrend(salesHistory, lastDays=30);
  
  // Step 4: Forecast = velocity × seasonal × trend
  const baseForecast = velocity * 30;
  const seasonalForecast = baseForecast * seasonalFactor;
  const trendAdjusted = seasonalForecast * (1 + trend);
  
  // Step 5: Restock check
  const leadTime = supplier.leadTimeDays || 7;
  const safetyStock = baseForecast * 0.1; // 10% buffer
  const targetInventory = (trendAdjusted * leadTime) + safetyStock;
  const currentStock = product.quantity;
  
  if (currentStock < targetInventory) {
    // Create alert
    const restockQuantity = targetInventory - currentStock;
    const restockCost = restockQuantity * supplier.unitCost;
    
    // Alert admin via Zalo
    sendAlert({
      type: 'RESTOCK_RECOMMENDED',
      message: `⚠️ ${product.name} cần restock\n` +
               `Stock hiện tại: ${currentStock}\n` +
               `Dự báo nhu cầu: ${trendAdjusted.toFixed(0)} units/30 ngày\n` +
               `Khuyến cáo restock: ${restockQuantity.toFixed(0)} units ($${restockCost.toFixed(2)})`,
      actionButtons: ['Approve', 'Reject', 'Adjust quantity']
    });
  }
  
  // Save forecast
  saveForecast({
    productId: product.id,
    demandForecast: trendAdjusted,
    confidence: calculateConfidence(salesHistory), // higher for stable sales
    model: 'velocity_seasonal_trend'
  });
}
```

### **Alert Examples**

```
🚨 CRITICAL STOCK
Product: VPS 1GB
Current Stock: 2 units
Forecast: 25 units/month
Lead Time: 7 days
→ RESTOCK NOW! [Approve] [Adjust] [Reject]

⚠️ DEAD STOCK
Product: Old Shared Hosting Plan
No sales in 120 days
Quantity: 15 units (taking shelf space)
→ Consider discontinuing [View] [Edit Price] [Archive]

✅ HEALTHY STOCK
Product: VPS 2GB
Stock: 85 units
Velocity: 15 units/week
Forecast confidence: 95%
Status: OK until day 20
```

### **Implementation Checklist**

- [ ] Create `/apps/bot/src/modules/inventory-optimizer/` folder
- [ ] Create 6 tools above
- [ ] Design demand prediction algorithm
- [ ] Add database schema
- [ ] Run historical data analysis
- [ ] Set up Groq background agent (daily 2 AM)
- [ ] Test with real inventory data
- [ ] Configure alerts sensitivity
- [ ] Deploy & monitor
- [ ] Tune forecasting accuracy over time

**Effort:** 3-4 days | **Team:** 1 Backend Dev

---

## 💰 Phase 3: Profit Analysis (Week 4)

### **What It Will Do**

```
Analyze Transactions → Calculate Profit → Generate Reports → Alert Admin

Examples:
- 📊 Daily Report: "Today: $2,500 revenue, $1,850 cost, $650 profit (26%)"
- 📈 Trending: "VPS 2GB profit up 40% vs last week"
- 🏆 Top Performers: "VPS 2GB generates $500/day profit (38% margin)"
- ⚠️ Underperformers: "Shared Hosting: $50/day profit (10% margin) - Consider discontinuing"
```

### **New Module: ProfitAnalysisModule**

**Tools to Create:**
```typescript
export class ProfitAnalysisModule extends BaseModule {
  private _tools: ITool[] = [
    // Reports
    getDailyReportTool({
      date?: string // defaults to today
    }) → Daily P&L summary: revenue, cost, profit, margin %
    
    getWeeklyReportTool() → Week P&L trends
    
    getMonthlyReportTool() → Month P&L with charts
    
    // Analysis
    getProductMarginTool({
      productId: string
    }) → Profit margin per product (absolute & percentage)
    
    getTopProductsByProfitTool({
      limit: number = 10,
      period: 'day' | 'week' | 'month'
    }) → Top 10 profit-generating products
    
    getBottomProductsByProfitTool({
      limit: number = 5
    }) → Bottom 5 products (might discontinue)
    
    analyzeProfitTrendsTool({
      productId: string,
      days: number = 30
    }) → Profit trend over time
    
    // Exports
    exportReportTool({
      format: 'pdf' | 'csv' | 'image',
      reportType: 'daily' | 'weekly' | 'monthly',
      date?: string
    }) → Generate downloadable report
  ];
}
```

### **Database Schema Additions**

```sql
-- Detailed transaction tracking (daily snapshot)
CREATE TABLE ecom_profit_analysis (
  id INTEGER PRIMARY KEY,
  date DATE,
  productId TEXT,
  quantitySold INTEGER,
  revenue DECIMAL(10, 2),           -- selling price × qty
  costOfGoods DECIMAL(10, 2),       -- supplier cost × qty
  operatingCost DECIMAL(10, 2),     -- shipping, packaging, etc.
  profit DECIMAL(10, 2),            -- revenue - cost - operating
  marginPercent REAL,               -- (profit / revenue) × 100
  FOREIGN KEY(productId) REFERENCES products(id)
);

-- Daily totals
CREATE TABLE ecom_daily_summary (
  id INTEGER PRIMARY KEY,
  date DATE UNIQUE,
  totalRevenue DECIMAL(10, 2),
  totalCostOfGoods DECIMAL(10, 2),
  totalOperatingCost DECIMAL(10, 2),
  totalProfit DECIMAL(10, 2),
  averageMarginPercent REAL,
  orderCount INTEGER,
  averageOrderValue DECIMAL(10, 2),
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Profit trends cache (for faster analytics)
CREATE TABLE ecom_profit_trends (
  id INTEGER PRIMARY KEY,
  productId TEXT,
  date DATE,
  profitTrend REAL,     -- % change vs previous day
  velocityTrend REAL,   -- sales change %
  marginTrend REAL,     -- margin change %
  FOREIGN KEY(productId) REFERENCES products(id)
);
```

### **Algorithm: Profit Calculation**

```javascript
// Run daily at 7 AM & 5 PM
cronExpression: "0 7,17 * * *"

async function generateProfitReport(date = new Date()) {
  const transactions = getTransactions(date);
  
  // Calculate by product
  const profitByProduct = {};
  let totalRevenue = 0;
  let totalCost = 0;
  let totalOperatingCost = 0;
  
  for (const product of products) {
    const sales = transactions.filter(t => t.productId === product.id);
    const qty = sum(sales, 'quantity');
    
    const revenue = qty * product.salePrice;
    const costOfGoods = qty * product.costPrice;
    const operatingCost = calculateOperatingCost(product, qty); // shipping, packaging
    const profit = revenue - costOfGoods - operatingCost;
    const margin = (profit / revenue) * 100;
    
    profitByProduct[product.id] = {
      productName: product.name,
      qty,
      revenue,
      costOfGoods,
      operatingCost,
      profit,
      marginPercent: margin
    };
    
    totalRevenue += revenue;
    totalCost += costOfGoods;
    totalOperatingCost += operatingCost;
  }
  
  const totalProfit = totalRevenue - totalCost - totalOperatingCost;
  const avgMargin = (totalProfit / totalRevenue) * 100;
  
  // Save to DB
  saveDailySummary({
    date,
    totalRevenue,
    totalCostOfGoods: totalCost,
    totalOperatingCost,
    totalProfit,
    averageMarginPercent: avgMargin,
    orderCount: transactions.length,
    averageOrderValue: totalRevenue / transactions.length
  });
  
  // Generate chart
  const chart = createChartTool({
    type: 'pie',
    title: `Profit by Product - ${formatDate(date)}`,
    data: Object.values(profitByProduct).map(p => ({
      label: p.productName,
      value: p.profit
    })),
    format: 'png'
  });
  
  // Alert admin
  sendAlert({
    type: 'DAILY_PROFIT_REPORT',
    message: `📊 Daily Profit Report - ${formatDate(date)}\n\n` +
             `💰 Revenue: $${totalRevenue.toFixed(2)}\n` +
             `📉 Cost: $${(totalCost + totalOperatingCost).toFixed(2)}\n` +
             `🎯 Profit: $${totalProfit.toFixed(2)}\n` +
             `📈 Margin: ${avgMargin.toFixed(1)}%\n` +
             `📦 Orders: ${transactions.length}\n` +
             `💵 Avg Order: $${(totalRevenue / transactions.length).toFixed(2)}\n`,
    attachments: [chart],
    actionButtons: ['View Detailed', 'Export PDF', 'Export CSV']
  });
  
  // Identify trends
  const top3 = sortBy(Object.values(profitByProduct), 'profit').slice(-3);
  const bottom3 = sortBy(Object.values(profitByProduct), 'profit').slice(0, 3);
  
  sendAlert({
    type: 'PROFIT_ANALYSIS',
    message: `🏆 Top Profit Products:\n` +
             top3.map(p => `  • ${p.productName}: $${p.profit.toFixed(2)} (${p.marginPercent.toFixed(1)}%)`).join('\n') +
             `\n\n⚠️ Bottom Performers:\n` +
             bottom3.map(p => `  • ${p.productName}: $${p.profit.toFixed(2)} (${p.marginPercent.toFixed(1)}%)`).join('\n')
  });
}
```

### **Report Examples**

```
📊 DAILY PROFIT REPORT - March 13, 2025

💰 Revenue:          $3,250
📉 Cost of Goods:    $2,100
🚚 Operating Cost:   $420
🎯 Net Profit:       $730
📈 Profit Margin:    22.5%

📦 Orders:           45
💵 Avg Order Value:  $72.22
⭐ Conversion Rate:  3.2%

🏆 TOP 3 PRODUCTS:
  1. VPS 2GB:        $320 profit (28% margin)
  2. VPS 4GB:        $180 profit (25% margin)
  3. Domain .com:    $95 profit (42% margin)

⚠️ BOTTOM 3 PRODUCTS:
  1. Shared Hosting: $20 profit (8% margin)
  2. Email Add-on:   $15 profit (12% margin)
  3. SSL Certificate: $10 profit (15% margin)

📈 TREND vs Yesterday:
  Revenue:  +12% ↑
  Profit:   +18% ↑
  Margin:   +3% ↑
```

### **Implementation Checklist**

- [ ] Create `/apps/bot/src/modules/profit-analyzer/` folder
- [ ] Create 8 tools above
- [ ] Design profit calculation engine
- [ ] Add database schema for transactions
- [ ] Implement Groq background agent (daily 7 AM & 5 PM)
- [ ] Create chart generation (use existing mediaModule)
- [ ] Test with sample data
- [ ] Set up profit trend tracking
- [ ] Deploy & monitor
- [ ] Calibrate alerts

**Effort:** 3-5 days | **Team:** 1 Backend Dev

---

## 📈 Phase 4: Market Trend Forecasting (Week 5-6)

### **What It Will Do**

```
Analyze Historical Data → Detect Patterns → Forecast Trends → Alert Admin

Examples:
- 📊 Forecast: "VPS demand forecast: 120 units next week (+18%)"
- 🔮 Trend: "Shared Hosting declining -15%/month. Recommendation: Discontinue in 6 months"
- 🎯 Seasonal: "Detected: Peak season in Q4. Prepare inventory +40%"
- 🏪 Competitive: "Competitors dropped VPS 2GB price by $2. We can undercut"
```

### **New Module: TrendForecastModule**

**Tools to Create:**
```typescript
export class TrendForecastModule extends BaseModule {
  private _tools: ITool[] = [
    // Forecasting
    forecastProductDemandTool({
      productId: string,
      forecastDays: number = 90
    }) → 90-day demand forecast with confidence
    
    detectSeasonalityTool({
      productId: string
    }) → Identify seasonal patterns (if any)
    
    calculateTrendVelocityTool({
      productId: string,
      period: 'week' | 'month'
    }) → Product trend direction & speed
    
    // Market Intelligence
    competitorPriceTrackTool({
      productName: string
    }) → Monitor competitor prices (scraping)
    
    marketGrowthTool({
      category: string
    }) → Market size & growth rate for category
    
    // Recommendations
    generateTrendReportTool({
      forecastPeriod: 'monthly' | 'quarterly'
    }) → Executive trend summary
    
    // ML (Optional)
    trainMLModelTool({
      productIds: string[],
      historicalDays: number = 365
    }) → Train ML model on historical data (Groq)
  ];
}
```

### **Database Schema Additions**

```sql
-- Market trends cache
CREATE TABLE ecom_market_trends (
  id INTEGER PRIMARY KEY,
  productId TEXT,
  forecastDate DATE,
  demandForecast FLOAT,
  confidence REAL,            -- 0-100%
  trendDirection TEXT,        -- 'up', 'down', 'stable'
  trendVelocity REAL,         -- % change per week/month
  seasonalityFactor REAL,     -- 1.0 = no seasonal, 1.5 = 50% seasonal boost
  forecastMethod TEXT,        -- 'velocity', 'seasonal', 'ml'
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(productId) REFERENCES products(id)
);

-- Competitor tracking
CREATE TABLE ecom_competitor_pricing (
  id INTEGER PRIMARY KEY,
  competitorName TEXT,
  productName TEXT,
  price DECIMAL(10, 2),
  lastUpdated TIMESTAMP,
  url TEXT,
  notes TEXT
);

-- Category market data
CREATE TABLE ecom_market_data (
  id INTEGER PRIMARY KEY,
  category TEXT,
  marketSize DECIMAL(15, 2),   -- Total market value
  growthRate REAL,              -- % growth per year
  lastUpdated TIMESTAMP,
  source TEXT                   -- Where data comes from
);

-- ML Model performance
CREATE TABLE ecom_forecast_accuracy (
  id INTEGER PRIMARY KEY,
  productId TEXT,
  forecastDate DATE,
  predicted FLOAT,
  actual FLOAT,
  error REAL,                  -- % error
  modelName TEXT,              -- model used for prediction
  FOREIGN KEY(productId) REFERENCES products(id)
);
```

### **Algorithm: Demand Forecasting (3 Methods)**

```javascript
// Method 1: Velocity-based (simple, fast)
function velocityForecast(productId, forecastDays) {
  const velocity = getVelocity(productId, days=90);
  return velocity * (forecastDays / 90);
}

// Method 2: Seasonal decomposition (medium)
function seasonalForecast(productId, forecastDays) {
  const historical = getSalesData(productId, days=365);
  
  // Decompose: trend + seasonal + residual
  const trend = calculateTrend(historical);
  const seasonal = detectSeasonality(historical);
  const residual = calculateResidual(historical, trend, seasonal);
  
  // Forecast each component
  const trendForecast = trend.slope * (forecastDays / 365);
  const seasonalForecast = seasonal[forecastDate.monthDay];
  const residualForecast = mean(residual) + randomNoise();
  
  return trendForecast + seasonalForecast + residualForecast;
}

// Method 3: ML-based (advanced, via Groq)
async function mlForecast(productId, forecastDays) {
  const historical = getSalesData(productId, days=365);
  
  const prompt = `
    Analyze this 1-year sales data for product "${getProductName(productId)}":
    ${JSON.stringify(historical)}
    
    Consider:
    - Trend (up/down/stable)
    - Seasonality (monthly, weekly patterns)
    - Special events (holidays, promotions)
    - Market context
    
    Forecast next ${forecastDays} days:
    - Point estimate
    - Confidence interval (95%)
    - Reasoning
    
    Return as JSON: {forecast, confidence, reasoning}
  `;
  
  const result = await groqAPI.generate(prompt);
  return JSON.parse(result);
}

// Combined forecasting
function combinedForecast(productId, forecastDays) {
  const v = velocityForecast(productId, forecastDays);
  const s = seasonalForecast(productId, forecastDays);
  const m = mlForecast(productId, forecastDays);
  
  // Weighted average: 30% velocity, 40% seasonal, 30% ML
  return (v * 0.3) + (s * 0.4) + (m.forecast * 0.3);
}
```

### **Trend Report Example**

```
📈 MARKET TREND FORECAST - Q2 2025 (April-June)

🔮 FORECAST SUMMARY:
Overall Market Growth: +22% YoY
E-commerce Growth: +18% YoY
Our Category (VPS): +15% projected

🏆 TOP GROWING PRODUCTS:
1. VPS 4GB:              +45% forecast
2. VPS 8GB:              +38% forecast
3. Managed VPS:          +32% forecast

📉 DECLINING PRODUCTS:
1. Shared Hosting:       -20% forecast (DEPRECATING)
2. Email Hosting:        -15% forecast
3. Reseller Hosting:     -8% forecast

⚠️ STRATEGIC RECOMMENDATIONS:
1. ✅ Increase VPS 4GB inventory (lead time 10 days, forecast: 450 units)
2. ✅ Phase out Shared Hosting (declining 2% monthly)
3. ✅ Launch Kubernetes hosting (market trending up, we don't have)
4. ✅ Competitive pricing: Lower VPS 2GB by $1 (competitors at $8/mo, we at $10/mo)

🏪 COMPETITOR INTEL:
- DigitalOcean: VPS prices down 10% this quarter
- Linode: Added GPU VPS (new market segment)
- Vultr: Expanded to 15 regions (we have 6)

🎯 ACTIONS FOR NEXT 30 DAYS:
1. [ ] Restock VPS 4GB (forecast +45%)
2. [ ] Price analysis (undercut competitors on VPS 2GB)
3. [ ] Plan Kubernetes product launch
4. [ ] Discontinue Shared Hosting promotions
5. [ ] Expand to 2 new regions
```

### **Implementation Checklist**

- [ ] Create `/apps/bot/src/modules/trend-forecaster/` folder
- [ ] Implement velocity-based forecasting (1-2 days)
- [ ] Add seasonal decomposition (2-3 days)
- [ ] Implement ML forecasting via Groq (2-3 days)
- [ ] Add database schema
- [ ] Set up competitor price tracking (web scraping)
- [ ] Implement trend alert system
- [ ] Test accuracy against historical data
- [ ] Generate trend reports
- [ ] Deploy & monitor accuracy
- [ ] Calibrate forecasts monthly

**Effort:** 5-7 days | **Team:** 1 Backend Dev + 1 Data Analyst (optional)

---

## 📅 Full Implementation Timeline

```
WEEK 1-2: CSKH Bot
├── Mon-Tue:  Design API endpoints
├── Wed-Thu:  Implement 8 tools
├── Fri:      Integration testing
└── Week 2:   Deployment & beta testing

WEEK 3: Inventory Optimization
├── Mon:      Design algorithms
├── Tue-Wed:  Implement tools
├── Thu:      Database setup
└── Fri:      Testing & deployment

WEEK 4: Profit Analysis
├── Mon:      Design profit engine
├── Tue:      Implement tools
├── Wed:      Chart generation
├── Thu:      Testing
└── Fri:      Deployment

WEEK 5-6: Market Trends
├── Mon-Tue:  Forecasting algorithms
├── Wed:      ML integration (optional)
├── Thu:      Competitor tracking
├── Fri:      Report generation
└── Week 6:   Testing, calibration, deployment

TOTAL: 26-28 days (~5.5 weeks)
```

---

## 💰 Resource Requirements

| Phase | Backend Dev | Data Analyst | QA | Days | Cost |
|-------|-------------|--------------|-----|------|------|
| CSKH (Phase 1) | 1 | - | 1 | 10 | $2,500 |
| Inventory (Phase 2) | 1 | 0.5 | - | 4 | $1,000 |
| Profit (Phase 3) | 1 | 0.5 | - | 5 | $1,250 |
| Trends (Phase 4) | 1 | 1 | - | 7 | $1,750 |
| **TOTAL** | **1-2** | **1** | **1** | **26-28** | **$6,500** |

---

## 🚀 How to Start

### **Step 1: Setup bot-zalo Locally**
```bash
cd D:\bot-zalo
bun install
bun run bot   # Start bot
bun run web   # Start dashboard
```

### **Step 2: Explore Current Code**
- Read `/apps/bot/src/modules/` structure
- Understand how tools are defined
- Check `/apps/bot/src/infrastructure/api.ts` (Hono API)

### **Step 3: Design Phase 1 API**
- List Digital-Shop endpoints needed
- Design request/response schemas
- Create mock API (for testing)

### **Step 4: Start Implementing**
- Create `EcomCskhModule` in bot-zalo
- Implement 8 tools
- Test with Digital-Shop API

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Gemini API rate limits | 🔴 High | Rotate API keys, cache responses, use Groq fallback |
| SQLite scaling issues | 🟡 Medium | Backup to GitHub Gist, plan PostgreSQL migration later |
| Bot instance downtime | 🟡 Medium | Add health checks, auto-restart, redundancy setup |
| API integration delays | 🟡 Medium | Mock APIs first, use staging environment |
| Forecast accuracy | 🟢 Low | Add confidence scores, retrain models monthly |

---

## ✅ Success Criteria

**Phase 1 (CSKH):**
- ✅ 8/8 tools implemented & tested
- ✅ 50+ customer conversations without errors
- ✅ >95% first-response accuracy
- ✅ <2s average response time

**Phase 2 (Inventory):**
- ✅ Forecast accuracy >80%
- ✅ Zero stockout situations
- ✅ Reduce dead stock by 30%

**Phase 3 (Profit):**
- ✅ Daily reports accurate within 2%
- ✅ Admin receives alerts without errors
- ✅ Charts render correctly

**Phase 4 (Trends):**
- ✅ Forecast accuracy >75%
- ✅ Actionable insights provided
- ✅ Strategic decisions made based on forecasts

---

## 🎯 Next Steps

1. **Review this plan** - Any changes needed?
2. **Approve resources** - Can we allocate 1-2 devs?
3. **Start Phase 1** - Begin CSKH module development
4. **Deploy bot-zalo** - Get it running alongside Digital-Shop
5. **Monitor & Iterate** - Track metrics, improve accuracy

**Ready to start? Let's build! 🚀**
