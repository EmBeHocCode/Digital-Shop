# 🤖 Agency Agents for Digital-Shop

This guide explains how to use AI agents from the `agency-agents` repository to accelerate development, improve code quality, and optimize business metrics.

## Quick Start

All agents are located in `/agents/` directory. Each is a standalone prompt template optimized for GitHub Copilot and other LLMs.

### Activate an Agent in GitHub Copilot

```
Activate [Agent Name] and help me with [task]

Example:
Activate Frontend Developer and build a product filter component
```

---

## 🏗️ Engineering Agents

### Frontend Developer
**Purpose**: Build high-conversion React/Next.js components with focus on accessibility & performance

**When to Use**:
- Building new product pages, checkout flows, cart interfaces
- Optimizing component performance
- Ensuring accessibility compliance (WCAG 2.1 AA)
- Refactoring existing components

**Example Usage**:
```
Activate Frontend Developer and build a product card component that:
- Shows product name, price, image
- Has add-to-cart button with loading state
- Is accessible (keyboard navigable, ARIA labels)
- Works on mobile and desktop
```

**What to Expect**:
- Full TypeScript component with strict types
- Accessibility best practices built-in
- Performance optimizations (React.memo, lazy loading)
- Mobile-first responsive design

---

### Backend Architect
**Purpose**: Design scalable APIs, optimize databases, ensure security

**When to Use**:
- Planning API endpoints for new features
- Optimizing database queries and schema
- Implementing authentication/authorization
- Designing payment processing flows
- Planning infrastructure for scale

**Example Usage**:
```
Activate Backend Architect and design the API for:
- Product filtering by price, category, rating
- Real-time inventory updates
- Shopping cart persistence
- Order checkout flow
```

**What to Expect**:
- Database schema with proper indexing
- API endpoint specifications with validation
- Security best practices (rate limiting, encryption)
- Performance considerations for e-commerce scale

---

### Code Reviewer
**Purpose**: Catch bugs, security vulnerabilities, performance issues before they reach production

**When to Use**:
- Before merging pull requests
- For security-sensitive code (payments, auth, user data)
- After refactoring critical paths
- When onboarding new developers

**Example Usage**:
```
Activate Code Reviewer and review this payment processing code:
[paste code snippet]

Look for security issues, performance problems, and maintainability concerns.
```

**What to Expect**:
- Specific security findings with fixes
- Performance optimization suggestions
- Code quality improvements
- Testing gap identification

---

## 📊 Product Agents

### Product Manager
**Purpose**: Prioritize features, validate product-market fit, drive roadmap

**When to Use**:
- Planning quarterly roadmap
- Evaluating feature requests from customers/team
- Analyzing competitive landscape
- Defining success metrics for new features

**Example Usage**:
```
Activate Product Manager to help me prioritize these features:
- Advanced search with autocomplete
- Product reviews and ratings
- Wishlist functionality
- Email notification system

What should we do first? Why?
```

**What to Expect**:
- Prioritization scorecard with reasoning
- Customer validation research suggestions
- Competitive analysis
- Business case with metrics

---

## 💰 Sales & Marketing Agents

### E-commerce Strategist
**Purpose**: Drive revenue through conversion optimization, pricing strategy, customer retention

**When to Use**:
- Writing product descriptions that convert
- Planning promotional campaigns
- Optimizing pricing strategy
- Building email marketing sequences
- Analyzing funnel conversion metrics

**Example Usage**:
```
Activate E-commerce Strategist to help me:
- Write compelling product descriptions for our premium coffee machine
- Design email sequence for new customer onboarding
- Optimize pricing for maximum revenue
- Create A/B test variants for product pages
```

**What to Expect**:
- Conversion-focused copy with benefit emphasis
- Pricing analysis with psychological principles
- Email sequences with open/click optimization
- A/B testing recommendations

---

## 📁 Agent Directory Structure

```
/agents
├── engineering/
│   ├── frontend-developer.md
│   ├── backend-architect.md
│   └── code-reviewer.md
├── product/
│   └── product-manager.md
└── sales/
    └── ecommerce-strategist.md
```

---

## 🚀 Common Workflows

### Workflow 1: Ship a New Feature

1. **Product Manager** → Prioritize & define success metrics
   ```
   Activate Product Manager: Should we build product filtering? 
   What's the business case?
   ```

2. **Backend Architect** → Design API & database
   ```
   Activate Backend Architect: Design API for product filtering 
   with real-time inventory updates
   ```

3. **Frontend Developer** → Build UI component
   ```
   Activate Frontend Developer: Build a product filter component 
   that integrates with this API [paste schema]
   ```

4. **Code Reviewer** → Quality assurance
   ```
   Activate Code Reviewer: Review this code for security, 
   performance, and accessibility issues [paste code]
   ```

5. **E-commerce Strategist** → Optimize for revenue
   ```
   Activate E-commerce Strategist: How do we position 
   product filtering in marketing? Any conversion impacts?
   ```

---

### Workflow 2: Optimize Checkout Flow

1. **E-commerce Strategist** → Analyze metrics & identify issues
   ```
   Our checkout abandonment rate is 75%. Top pain points:
   - 3-step checkout feels long
   - Payment form unclear
   - Shipping cost surprise at end
   
   How do we optimize?
   ```

2. **Frontend Developer** → Implement improved UX
   ```
   Activate Frontend Developer: Build a one-page checkout 
   that shows total cost upfront and validates in real-time
   ```

3. **Backend Architect** → Ensure payment security
   ```
   Activate Backend Architect: Review the checkout API. 
   Does it meet PCI compliance? Any security gaps?
   ```

4. **Code Reviewer** → Verify quality
   ```
   Activate Code Reviewer: Checkout code review - focus on 
   security (payment handling), performance, error cases
   ```

5. **E-commerce Strategist** → Plan launch & A/B test
   ```
   Activate E-commerce Strategist: Design A/B test variants 
   for the new checkout. What metrics should we track?
   ```

---

### Workflow 3: Scale Infrastructure

1. **Backend Architect** → Assess scalability
   ```
   We're at 1k concurrent users. How do we scale to 10k?
   - Database queries slowing down
   - Memory usage spiking
   
   Design a scalable architecture
   ```

2. **Code Reviewer** → Identify optimization points
   ```
   Activate Code Reviewer: Where are the performance 
   bottlenecks in this product listing query?
   ```

3. **Frontend Developer** → Optimize client-side
   ```
   Activate Frontend Developer: Implement code splitting 
   and lazy loading for product pages
   ```

---

## 💡 Pro Tips

### Get Better Results

1. **Be Specific** ✅
   ```
   Good: "Build a product filter that filters by price and category, 
   shows matching product count, and persists filter state"
   
   Bad: "Build a filter"
   ```

2. **Provide Context** ✅
   ```
   Good: "We're using Next.js 16, Tailwind CSS, Radix UI. 
   Our product cards are component at /components/ProductCard.tsx"
   
   Bad: Just paste code without context
   ```

3. **Ask Why** ✅
   ```
   Good: "Should we use Redis for caching? Why or why not?"
   
   Bad: Just implement what the agent suggests
   ```

4. **Iterate** ✅
   ```
   "That's good but we need to handle [edge case]. 
   Can you update the code?"
   ```

### Safety Guidelines

- ✅ Use agents for **planning, design, code review**
- ✅ Use agents to **validate** your decisions
- ✅ Use agents to **learn** best practices
- ⚠️ **Verify** security-sensitive code (payments, auth)
- ⚠️ **Test** performance-critical code before production
- ⚠️ **Never commit secrets** that agents might suggest

---

## 📈 Expected Impact

Using agents consistently should improve:

| Metric | Expected Improvement |
|--------|----------------------|
| Code Quality | -40% bugs before production |
| Development Speed | +30% faster feature shipping |
| Security | -80% security vulnerabilities |
| Performance | +50% faster page loads |
| Conversion Rate | +3-5% with optimized UX/copy |
| Customer Retention | +15% with strategic improvements |

---

## 🔗 Related Resources

- **Agency-Agents Repository**: https://github.com/msitarzewski/agency-agents
- **GitHub Copilot Docs**: https://docs.github.com/en/copilot
- **Next.js Documentation**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 🤝 Feedback & Improvements

Found a better way to use these agents? Improve an agent prompt? 
Create an issue or pull request to share your learnings with the team!

---

**Last Updated**: 2026-03-13
**Maintained By**: Product & Engineering Teams
