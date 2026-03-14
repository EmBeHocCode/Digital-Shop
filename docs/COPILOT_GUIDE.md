# 🎯 Hướng Dẫn: Làm Cho Copilot Tuân Theo Agents

Để Copilot thực thi agents **chính xác & nhất quán**, đây là cách:

---

## 🚀 Cách Nhanh Nhất (5 phút)

### Phương pháp 1: Reference Agent File (BEST ⭐⭐⭐⭐⭐)

**Trong GitHub Copilot Chat, gõ:**
```
Read /agents/engineering/frontend-developer.md

Then help me build a product card component with:
- Product image, name, price
- "Add to Cart" button with loading state
- Is mobile responsive & accessible
```

**Kết quả**: Copilot sẽ:
- ✅ Adopt exactly mindset từ agent
- ✅ Tuân theo agent's workflow
- ✅ Tự động output TypeScript + accessibility + performance optimization
- ✅ Reference agent's success metrics

**Tại sao hoạt động?** Vì agent file chứa:
- Identity & personality → Copilot adopts mindset
- Core mission → Guides priorities  
- Critical rules → Enforces constraints
- Technical deliverables → Provides templates
- Success metrics → Sets expectations

---

### Phương pháp 2: Paste Agent Context (Khi file access không hoạt động)

**Step 1: Copy agent frontmatter + mission**
```yaml
---
name: Frontend Developer
description: React/Next.js specialist - high-conversion, accessible, performant
emoji: 🎨
vibe: Detail-oriented craftsman obsessed with UX excellence
---

## 🧠 Your Identity & Memory
- Role: Senior Frontend Engineer specializing in e-commerce
- Priority: Conversion rate > performance > aesthetics
- Tech: React 19, TypeScript, Tailwind CSS, Radix UI

## 🎯 Your Core Mission
### Building High-Conversion Components
- Create reusable, accessible React components
- Follow existing Radix UI + shadcn/ui design system
- Responsive design for mobile-first commerce
- Ensure WCAG 2.1 AA accessibility standards

## 🚨 Critical Rules You Must Follow
1. Always use TypeScript - No JavaScript
2. Accessibility First - WCAG 2.1 AA compliance
3. No Performance Regressions - Profile before/after
```

**Step 2: Paste vào Copilot Chat**
```
[Paste agent context từ trên]

Now following this persona, build a shopping cart component with:
- Show products with price, quantity controls
- Calculate & display running total
- Proceed to checkout button
- Mobile responsive
- Fully accessible
```

**Kết quả**: Copilot will adopt that exact persona

---

## ⚙️ Advanced: GitHub Copilot Configuration

### Setup .copilot Folder

```bash
# Tạo cấu trúc
mkdir -p .copilot/agents
cp agents/* .copilot/agents/
```

**Tạo `.copilot/context.md`:**
```markdown
# Project Context

## Available Agents
Reference these in chat:

### Engineering
- @frontend-dev: /agents/engineering/frontend-developer.md
- @backend-arch: /agents/engineering/backend-architect.md  
- @code-reviewer: /agents/engineering/code-reviewer.md

### Product
- @product-mgr: /agents/product/product-manager.md

### Sales
- @ecommerce: /agents/sales/ecommerce-strategist.md

## Tech Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS + Radix UI + shadcn/ui
- React Hook Form + Zod validation
- PostgreSQL + Express backend

## Command Pattern
Activate [Agent Name] and [task]

Example:
Activate Frontend Developer and build a product filter component
```

---

## ✅ Verify Copilot Tuân Theo Agent

### Checklist cho Frontend Developer Agent

Copilot output phải có:

- ✅ **TypeScript Strict Types**
  ```typescript
  interface ProductCardProps {
    productId: string  // ← explicit type, not any
    name: string
    onAddToCart: (id: string) => Promise<void>
  }
  ```

- ✅ **Accessibility (WCAG 2.1 AA)**
  ```typescript
  <button aria-label={`Add ${name} to cart`}>
  <div role="alert">{error}</div>
  ```

- ✅ **Performance Optimization**
  ```typescript
  export const ProductCard = React.memo(...)
  const handleClick = useCallback(() => {...}, [])
  ```

- ✅ **Mobile-First Responsive**
  ```typescript
  className="max-w-full md:max-w-sm lg:max-w-md"
  ```

- ✅ **Error States & Loading**
  ```typescript
  {isLoading && <span>Adding...</span>}
  {error && <p role="alert">{error}</p>}
  ```

**If missing any:**
```
"Wait, you're not following the Frontend Developer agent.

Remember:
- Strict TypeScript (no 'any')
- WCAG 2.1 AA accessibility (ARIA labels)
- Performance optimized (React.memo, useCallback)

Show me the TypeScript types and ARIA labels."
```

---

### Checklist cho Code Reviewer Agent

Copilot must identify:

- ✅ **Security Issues**
  ```
  "This has SQL injection risk - use parameterized queries"
  ```

- ✅ **Performance Bottlenecks**
  ```
  "N+1 query problem: Fetching product on every iteration"
  ```

- ✅ **Accessibility Violations**
  ```
  "Missing ARIA labels on dynamic content"
  ```

- ✅ **Specific Fixes**
  ```
  "Before: ... 
   After: ..."
  ```

**If too generic:**
```
"Use the Code Reviewer agent's checklist format.
Give me:
1. Specific security findings
2. Performance metrics impact
3. Accessibility issues
4. Concrete fixes with code"
```

---

## 💡 Prompt Engineering Tips

### Tip 1: Be VERY Specific ❌➜✅

```
❌ "Build a button"

✅ "Following the Frontend Developer agent pattern:
- Button text: 'Add to Cart'
- Disabled state when out of stock
- Loading state while adding
- Success feedback (toast notification)
- Mobile optimized (48px minimum tap target)
- Keyboard accessible (Enter to activate)
- ARIA label for screen readers"
```

### Tip 2: Reference Agent's Mission

```
"Following your core mission of building high-conversion components:

Show me code that:
1. Maximizes conversion (clear CTA, removes friction)
2. Ensures accessibility (WCAG 2.1 AA)
3. Optimizes performance (<100ms render)
4. Uses strict TypeScript (no 'any' types)"
```

### Tip 3: Request Agent's Workflow Process

```
"Walk me through YOUR workflow process (from the agent) for this:

Step 1: [Requirements & Design Review]
Step 2: [Component Development]
Step 3: [Testing & Optimization]
Step 4: [Integration & Verification]

Apply each step to building: [task]"
```

### Tip 4: Copy Agent's Communication Style

```
Frontend Dev style:
"I noticed this could cause CLS. Should we optimize image loading?"

Backend Architect style:
"Current schema will cause lock contention. Let's use row-level locking."

Code Reviewer style:
"This looks good. One thing—I'd be concerned about the N+1 query here..."
```

---

## 🔄 Multi-Agent Workflows

### Orchestrate Full Feature Development

```
I'm building product filtering for Digital-Shop.

Walk me through this using ALL agents:

1. Product Manager: 
   - Should we prioritize this?
   - What's the business case?

2. Backend Architect:
   - Design the API & database schema
   - Performance considerations

3. Frontend Developer:
   - Build the filter component
   - Ensure accessibility & performance

4. Code Reviewer:
   - QA the code (security, perf, a11y)
   - Identify issues

5. E-commerce Strategist:
   - How does this impact conversion?
   - Launch strategy

For each step, use that agent's exact approach & communication style.
```

---

## ⚠️ Khi Copilot Không Tuân Theo Agent

### Problem 1: Copilot chỉ đưa generic advice

**Solution:**
```
"You're not following the [Agent Name] approach.

Re-read the agent's core mission:
[paste relevant section]

Specifically apply these constraints:
[paste critical rules section]

Now rebuild your answer with that context."
```

### Problem 2: Copilot quên context mid-conversation

**Solution:**
```
"Remember: You're the Frontend Developer agent.

Key constraints:
- Strict TypeScript (no 'any', explicit types)
- WCAG 2.1 AA accessibility
- Performance optimized (React.memo where needed)
- Mobile-first responsive design
- Use shadcn/ui + Tailwind CSS

Keep these in mind..."
```

### Problem 3: Copilot mixing agent approaches

**Solution:**
```
"Stay in ONE agent role. You're the Code Reviewer.

Your focus is:
- Identifying specific issues (not building solutions)
- Explaining WHY something is a problem
- Providing concrete fixes
- Using the code review template format

Let's restart the review with this focus."
```

---

## 🎯 Real-World Example: Checkout Component

### Setup (Good)
```
I'm referring to the Frontend Developer agent at /agents/engineering/frontend-developer.md

Tech context: Next.js, React Hook Form, Zod validation

Task: Build an optimized mobile checkout form
```

### Prompt (Better)
```
Following the Frontend Developer agent's core mission:

Build a mobile checkout form with:
✅ One-page layout (not multi-step on mobile)
✅ Show total cost upfront (no surprises)
✅ Real-time form validation with inline errors
✅ Keyboard accessible (Tab order, Enter to submit)
✅ ARIA labels for all inputs
✅ Mobile optimized (no horizontal scroll)
✅ Clear error messages
✅ Loading state on submit button

Use React Hook Form + Zod validation.
Use shadcn/ui Button + Input components.
Follow accessibility best practices.
```

### Result (Follow Agent)
Copilot will deliver:
```typescript
// ✅ TypeScript strict types
interface CheckoutFormProps {
  onSubmit: (data: CheckoutData) => Promise<void>
}

// ✅ React Hook Form + Zod
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(checkoutSchema)
})

// ✅ Accessibility (ARIA labels)
<input
  aria-label="Full name"
  aria-invalid={!!errors.fullName}
  aria-describedby="fullname-error"
/>

// ✅ Mobile-first responsive
<form className="max-w-full md:max-w-md mx-auto">

// ✅ Real-time validation with errors
{errors.email && (
  <p id="email-error" role="alert" className="text-red-600">
    {errors.email.message}
  </p>
)}

// ✅ Loading state
<button disabled={isSubmitting}>
  {isSubmitting ? 'Processing...' : 'Complete Order'}
</button>
```

---

## 📊 Effectiveness Comparison

| Method | Effort | Effectiveness | Best For |
|--------|--------|----------------|----------|
| Reference agent file (Method 1) | Low ⭐ | ⭐⭐⭐⭐⭐ | Quick tasks |
| Paste agent context (Method 2) | Medium ⭐⭐ | ⭐⭐⭐⭐⭐ | Complex work |
| Setup .copilot config (Advanced) | High ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Team workflows |
| Specific prompting | Low ⭐ | ⭐⭐⭐⭐ | Drift correction |

---

## ✨ TL;DR: The Quick Answer

**Để Copilot tuân theo agent:**

1. **Cách nhanh nhất (5 giây):**
   ```
   Read /agents/engineering/frontend-developer.md
   Then help me: [your task]
   ```

2. **Nếu không hoạt động:**
   ```
   [Paste agent frontmatter + mission section]
   
   Adopt this persona and help me: [task]
   ```

3. **Verify output:**
   - ✅ Có TypeScript strict types?
   - ✅ Có accessibility ARIA labels?
   - ✅ Có performance optimizations?
   - ✅ Có follow agent's style?

4. **Nếu copilot drift:**
   ```
   "You're not following [Agent]. Remember: [key constraint].
   Try again with that context."
   ```

5. **Pro Tip:** Càng specific prompt → càng tốt output

---

## 🎓 Next Steps

1. Open GitHub Copilot in VS Code
2. Try: `Read /agents/engineering/frontend-developer.md`
3. Paste task & verify output
4. Adjust prompt if needed
5. Share results with team

**Happy building!** 🚀
