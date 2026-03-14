# 🚀 Quick Reference: Copilot Agent Commands

Print this or bookmark for quick access.

---

## ✅ BEST Method - Reference Agent File (Copy-Paste Ready)

```
Read /agents/engineering/frontend-developer.md

Then help me build: [YOUR TASK]
```

**Replace `frontend-developer.md` with:**
- `backend-architect.md` (API, database, security)
- `code-reviewer.md` (QA, security audit)
- `product-manager.md` (prioritization, strategy)
- `ecommerce-strategist.md` (copy, pricing, conversion)

---

## 📋 Common Tasks + Exact Commands

### Task 1: Build React Component
```
Read /agents/engineering/frontend-developer.md

Build a shopping cart component with:
- List of products (name, price, image, quantity)
- Remove item button
- Calculate total price in real-time
- "Proceed to Checkout" button
- Mobile responsive (test on 375px)
- Fully accessible (keyboard, screen reader)
```

### Task 2: Design API Endpoint
```
Read /agents/engineering/backend-architect.md

Design an API endpoint for:
- Filter products by price (min/max)
- Filter by category
- Sort by newest/price
- Return product count & pagination

Context:
- 10k products in database
- Real-time inventory updates needed
- Currently ~5k concurrent users
```

### Task 3: Code Review
```
Read /agents/engineering/code-reviewer.md

Review this code for:
1. Security vulnerabilities
2. Performance issues
3. Accessibility compliance
4. Testing gaps

[PASTE YOUR CODE HERE]
```

### Task 4: Prioritize Feature
```
Read /agents/product/product-manager.md

Should we build product filtering?

Data:
- 40% of users abandon product list page
- Competitors all have this feature
- Estimated 1-week dev effort
- Potential 3% conversion rate lift

Give me a prioritization score & business case.
```

### Task 5: Write Product Copy
```
Read /agents/sales/ecommerce-strategist.md

Write compelling product description for our "Premium Coffee Maker":
- Price: $349
- Key benefit: Café-quality coffee at home
- Saves money vs daily café visits ($1,825/year)
- Target: Convert 3%+ of viewers to buyers

Include: Problem, solution, benefits, social proof, CTA
```

---

## 🔄 Multi-Agent Workflow (Copy-Paste)

```
I'm building a new feature. Use all 5 agents:

Feature: Wishlist functionality
Requirements: Save favorite products, share wishlist with friends

For EACH agent below, adopt their exact persona & provide detailed output:

1️⃣ PRODUCT MANAGER: Is this worth building? Business case?

2️⃣ BACKEND ARCHITECT: Design API, database schema, security

3️⃣ FRONTEND DEVELOPER: Build the UI component with full accessibility

4️⃣ CODE REVIEWER: QA - security, performance, accessibility issues

5️⃣ E-COMMERCE STRATEGIST: Launch strategy & conversion impact
```

---

## ⚡ When Copilot Drifts (Get Back on Track)

```
"You're not following the [AGENT] agent.

Remember your critical rules:
[INSERT CRITICAL RULES FROM AGENT]

Now try again with THAT context."
```

---

## ✔️ Verify Copilot is Following Agent

### Frontend Developer ✅ should have:
- Strict TypeScript types (no `any`)
- ARIA labels for accessibility
- React.memo for performance
- Mobile-first responsive design
- Error & loading states

### Backend Architect ✅ should have:
- Database schema with indexes
- API validation & error handling
- Security measures (rate limiting, encryption)
- Performance considerations
- Real code examples

### Code Reviewer ✅ should have:
- Specific security findings (not generic)
- Performance metrics & bottlenecks
- Accessibility violations
- Before/after code examples

### Product Manager ✅ should have:
- Impact vs effort scoring
- Customer validation strategy
- Business case with metrics
- Competitive analysis

### E-commerce Strategist ✅ should have:
- Customer benefit focus (not features)
- Conversion optimization ideas
- Pricing/psychology principles
- Email/marketing sequences

---

## 🎯 Pro Tips

1. **Be Specific** (not generic)
   ❌ "Build a form"
   ✅ "Build a checkout form with address validation, payment field, show total upfront"

2. **Provide Context**
   ✅ "We use Next.js 16, shadcn/ui, Zod validation"

3. **Request Output Format**
   ✅ "Show TypeScript code with strict types and ARIA labels"

4. **Iterate**
   ✅ "That's good but add support for [edge case]"

5. **Verify & Redirect**
   ✅ "This looks right. Does it follow your [agent] process?"

---

## 📍 File Locations (Reference)

```
/agents/
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

## 🔗 Related Docs

- `AGENTS.md` - Full usage guide (15 min)
- `EXAMPLE_WORKFLOWS.md` - Real scenarios (20 min)
- `COPILOT_GUIDE.md` - Deep Copilot guide (detailed)
- Individual agent `.md` files - Full agent documentation

---

## 💡 One More Thing

**The magic formula:**

```
[Read agent file] + [Be specific] + [Verify output] = Perfect results
```

That's it! 🚀

---

**Created**: 2026-03-13
**For**: Digital-Shop Team
**Print & Bookmark This!**
