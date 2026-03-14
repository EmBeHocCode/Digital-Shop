# 📋 Example Workflows - Using Agents for Digital-Shop

This file shows real examples of how to use the AI agents from the `/agents` directory.

---

## 🎯 Workflow 1: Launch Product Filtering Feature

**Goal**: Add price & category filtering to product listing page
**Timeline**: 2 weeks
**Team**: Frontend, Backend, Product

### Step 1: Product Manager - Define & Prioritize
**Your Task**: Decide if this should be built. What's the business case?

```
Activate Product Manager and help me evaluate this feature:

Problem: 40% of users leave our product listing page without finding what they want. 
They say "I want to filter by price and category."

Questions:
1. Should we prioritize this?
2. What success metrics should we track?
3. What's the ROI if we build this?
4. How does this compare to competitors?
```

**Agent Response Will Provide**:
- Prioritization scorecard (Impact vs Effort)
- Customer validation strategy
- Success metrics (conversion rate, time-on-page, etc.)
- Competitive analysis

---

### Step 2: Backend Architect - API Design
**Your Task**: Once approved, design the backend

```
Activate Backend Architect and design the filtering API:

Context:
- Stack: Next.js, TypeScript, PostgreSQL
- Current schema has: products (id, name, price, category, stock)
- Expected: 10k products, 5k concurrent users
- Need: Real-time inventory updates

Design:
1. API endpoint for filtering products by price/category
2. Database schema (is current schema optimized?)
3. Performance considerations for 10k products
4. Caching strategy
```

**Agent Response Will Provide**:
- Database schema with indexes
- API endpoint specifications with validation
- Performance optimization strategies
- Real-world code examples

---

### Step 3: Frontend Developer - Build UI
**Your Task**: Implement the filter component

```
Activate Frontend Developer and build the filter component:

Requirements:
- Price range slider (e.g., $10-$1000)
- Category checkboxes (Electronics, Books, Home, Clothing)
- Show product count updates in real-time
- Works on mobile & desktop
- Must be accessible (keyboard navigable, ARIA labels)
- Use existing: Radix UI, shadcn/ui, Tailwind CSS

Integration: 
- Calls API endpoint: GET /api/products?minPrice=X&maxPrice=Y&category=Z
- Updates product list as filters change
- Persists filter state (localStorage)

Performance:
- Lazy load product images
- Don't refetch on every slider movement (debounce)
```

**Agent Response Will Provide**:
- TypeScript React component with full implementation
- Mobile-responsive styling
- Accessibility best practices (WCAG 2.1 AA)
- Performance optimizations (React.memo, useCallback, etc.)

---

### Step 4: Code Reviewer - Quality Assurance
**Your Task**: Review code before merging

```
Activate Code Reviewer and review the filter implementation:

Review for:
1. Security - Any XSS vulnerabilities in filter inputs?
2. Performance - Are we optimizing API calls properly?
3. Accessibility - Can keyboard users navigate filters?
4. Testing - What edge cases should we test?

Code: [paste frontend component + API integration]
```

**Agent Response Will Provide**:
- Specific vulnerabilities & fixes
- Performance optimization suggestions
- Accessibility compliance check
- Testing recommendations

---

### Step 5: E-commerce Strategist - Optimize for Revenue
**Your Task**: Plan launch & optimize for conversions

```
Activate E-commerce Strategist and help with the launch:

Current metrics:
- Product page conversion rate: 2.1%
- Avg time on product list: 45 seconds
- Cart abandonment rate: 62%

Questions:
1. How do we market this new filtering feature?
2. Will this impact conversion rate? By how much?
3. Should we A/B test different filter layouts?
4. Any pricing/promotion opportunities?

Goal: Make filtering so good that more users convert
```

**Agent Response Will Provide**:
- Conversion impact analysis & A/B test recommendations
- Marketing messaging & announcement strategy
- Customer segmentation for personalized experiences
- Performance metrics to track post-launch

---

## 💡 Workflow 2: Optimize Checkout for Mobile

**Goal**: Reduce 73% mobile checkout abandonment rate
**Timeline**: 1-2 weeks
**Team**: Frontend, Backend, Product, Marketing

### Step 1: Identify Problem
```
Our data shows:
- Desktop checkout: 3.2% abandonment
- Mobile checkout: 73% abandonment (11x worse!)

Where do users drop off?
- 15% at shipping address
- 35% at payment form (Stripe)
- 23% see total cost at end
- Remaining at submit

This is costing us $500k/month in lost revenue.
```

### Step 2: Product Manager - Analyze & Prioritize
```
Activate Product Manager:

Mobile checkout abandonment is 73% vs 3.2% on desktop.
- What's causing the 70% gap?
- Should we redesign the flow or optimize current one?
- Competitors: How do they handle mobile checkout?
- What would 10% improvement mean for revenue?

Help me create a business case.
```

### Step 3: E-commerce Strategist - Understand Customer Pain
```
Activate E-commerce Strategist:

Mobile checkout abandonment data:
- 35% drop at payment form (too complicated?)
- 23% see total cost at end (sticker shock?)
- 15% at shipping address (form validation?)

Hypothesis: Users find mobile form too complex and don't trust it.

Questions:
1. What copy/UX changes increase mobile conversion?
2. Show cost upfront or at end? Psychology?
3. Guest checkout important for mobile?
```

### Step 4: Backend Architect - Support Changes
```
Activate Backend Architect:

We want to change our checkout API:
- Show total cost upfront (server-side calculation)
- Support guest checkout (not require login)
- Real-time form validation
- Better error messages

Current tech:
- Node.js API with Express
- Stripe payment integration
- PostgreSQL database

Design API that supports better mobile UX.
```

### Step 5: Frontend Developer - Build New Checkout
```
Activate Frontend Developer:

Redesign mobile checkout (one-page, 3-step):
1. Shipping address (real-time validation, clear errors)
2. Payment (Stripe, show total upfront, express checkout buttons)
3. Confirmation (order summary, next steps)

Requirements:
- Mobile-first design (small screens first)
- Show running total at all times
- Express checkout buttons (Apple Pay, Google Pay)
- Accessibility (no barriers)
- Performance (load fast on 3G)

Use: Next.js, React Hook Form, Zod, Tailwind
```

### Step 6: Code Reviewer - Ensure Quality
```
Activate Code Reviewer:

Security review for new checkout:
- Does form validation happen server-side?
- Is Stripe token handled securely?
- Any CSRF protection?
- PCI compliance concerns?

Performance review:
- Page load time target: <2s on 3G
- Form validation snappy (sub-100ms)?
- No network waterfalls?

Review: [paste checkout component]
```

### Step 7: Launch & Monitor
```
Activate E-commerce Strategist:

A/B test the new mobile checkout:
- Control: Current checkout (73% abandonment)
- Variant: New single-page checkout

Questions:
1. How long to test? (sample size?)
2. What success looks like?
3. If wins, how do we scale?
4. Any follow-up improvements?
```

**Expected Result**: Mobile checkout abandonment → 35% (40% improvement = $200k/month)

---

## 🔍 Workflow 3: Code Review & Optimization Session

**Goal**: Review product page performance after recent changes
**Time**: 30 minutes
**Participants**: Eng team + Code Reviewer agent

### Scenario
You just shipped a new product page with user reviews section. You notice the page feels slower on mobile.

### Steps

1. **Initial Diagnosis**
```
Activate Code Reviewer:

Our product page is slower than before after adding user reviews.
- Lighthouse score: 65 → 45
- LCP (largest content paint): 2.5s → 4.2s

What's the problem? Performance audit.

Code: [paste ProductPage.tsx component]
```

2. **Get Specific Recommendations**
```
Activate Code Reviewer:

Specific concerns:
- Are reviews loaded before page interactive?
- Are review images optimized?
- Any N+1 queries for fetching reviews?
- Is the reviews section lazy loaded?
```

3. **Implement Fixes**
```
Activate Frontend Developer:

Based on the performance review, optimize:
- Lazy load reviews section below fold
- Image optimization for review photos
- Debounce any real-time updates
- Code split reviews component

Keep existing UI, just improve performance.
```

4. **Verify No Regressions**
```
Activate Code Reviewer:

Final performance review:

Code: [paste optimized component]

Verify:
- No new bugs introduced?
- Accessibility still WCAG AA?
- Performance improved?
- What metrics should we track?
```

**Result**: Lighthouse 65 → 85, LCP 2.5s (restored)

---

## 📊 Quick Agent Reference

| Agent | Best For | Output |
|-------|----------|--------|
| **Product Manager** | Planning, prioritization, metrics | Business cases, roadmaps |
| **Backend Architect** | API/database design, scale | Specs, schemas, patterns |
| **Frontend Developer** | UI building, optimization | Components, performance |
| **Code Reviewer** | QA, security, performance | Feedback, fixes, improvements |
| **E-commerce Strategist** | Copy, pricing, conversion | Campaign strategy, messaging |

---

## 🚀 Tips for Success

1. **Provide Context** - More context = better suggestions
2. **Be Specific** - "Fix slow product page" vs "Optimize LCP on product page with 2000 reviews"
3. **Share Examples** - Show what good looks like
4. **Iterate** - Ask follow-up questions
5. **Verify** - Test agent suggestions before shipping
6. **Secure Sensitive Code** - Always review payment/auth code carefully

---

## 📚 Next Steps

- Read `/agents/README.md` for agent descriptions
- Check `../AGENTS.md` for detailed usage guide
- Try your first workflow above
- Create your own workflow adapted to your needs

---

**Questions?** Ask in your IDE with GitHub Copilot or refer to the agent files directly.
