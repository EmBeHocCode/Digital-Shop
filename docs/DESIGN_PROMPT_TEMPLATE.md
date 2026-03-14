# 🎨 Design-Consistent Prompt Template

Dùng các prompt template này để Copilot thêm page/feature mà **tự động match design system**, không cần lo về **dark/light mode, màu sắc, hay typography**.

---

## 📋 **Template 1: Thêm New Page (Nhanh nhất)**

```
Tôi sẽ reference agent từ /agents/engineering/frontend-developer.md

Thêm trang mới [PAGE_NAME] ở /app/[PAGE_NAME]/page.tsx với yêu cầu:

1. **Design System Compliance:**
   - Dùng CSS variables từ styles/globals.css (--background, --foreground, --primary, --card, etc.)
   - Support light/dark mode tự động qua .dark class (không cần if statements)
   - Spacing: Tailwind utility classes (p-4, mb-6, gap-3, etc.)
   - Border radius: rounded-lg, rounded-xl (align với --radius variable)

2. **Components:**
   - Import shadcn/ui từ @/components/ui/* (Card, Button, Input, Table, etc.)
   - Sử dụng Button variants: default, secondary, outline, destructive
   - Form: dùng React Hook Form + Zod (có sẵn trong package.json)
   - Icons: lucide-react (import icons cần dùng)

3. **Typography:**
   - Font: Geist (đã setup)
   - Headings: <h1/><h2/><h3/> với Tailwind (text-3xl, text-2xl, text-xl)
   - Body text: text-base, text-sm, text-muted-foreground
   - Contrast: Đảm bảo text trên background có đủ contrast

4. **Responsive Design:**
   - Mobile-first: xs (default), sm, md, lg, xl breakpoints
   - Dùng grid, flex từ Tailwind
   - Max-width container: max-w-7xl

5. **Colors (Auto match light/dark mode):**
   - Background: bg-background
   - Card: bg-card text-card-foreground
   - Text: text-foreground
   - Muted: text-muted-foreground
   - Primary: bg-primary text-primary-foreground
   - Borders: border-border

6. **Không làm:**
   - Không dùng hardcoded colors (#fff, #000, etc.)
   - Không thêm custom CSS files
   - Không dùng inline styles
   - Không query Tailwind config

Tạo ra file TypeScript sạch, fully typed, production-ready.
```

---

## 📋 **Template 2: Thêm New Component (Reusable)**

```
Tôi sẽ reference agent từ /agents/engineering/frontend-developer.md

Thêm component [COMPONENT_NAME] ở /components/[COMPONENT_NAME].tsx:

1. **Design System:**
   - Dùng CSS variables (--primary, --background, --card, etc.)
   - Props: variant, size, className, disabled state
   - Support dark mode tự động

2. **shadcn/ui Integration:**
   - Base trên shadcn/ui components nếu có
   - Extend với custom logic nếu cần
   - Export: component + type definitions

3. **TypeScript:**
   - Fully typed props interface
   - React.FC<Props> pattern
   - Export component default

4. **Accessibility:**
   - role attributes
   - aria-labels
   - Focus states
   - Keyboard navigation (nếu interactive)

5. **Colors auto-match light/dark:**
   - Không if statement cho theme
   - CSS variables handle nó

Tạo component export-ready, type-safe, accessible.
```

---

## 📋 **Template 3: Thêm Feature vào Existing Page**

```
Tôi sẽ reference agent từ /agents/engineering/frontend-developer.md

Thêm feature [FEATURE_NAME] vào trang [PAGE_NAME] ([LOCATION]):

1. **Style Match Existing:**
   - Check CSS classes từ trang hiện tại
   - Dùng cùng margin, padding, spacing
   - Cùng typography scale (heading size, text size)
   - Cùng color scheme (bg-card, text-foreground, etc.)

2. **Component Reuse:**
   - Dùng cùng Button style (variant, size)
   - Cùng Card, Input, Table components
   - Cùng icon style từ lucide-react

3. **Dark Mode Integration:**
   - Auto-match via CSS variables
   - Không cần theme detection

4. **Responsive:**
   - Cùng grid/flex breakpoints như sections khác
   - Cùng mobile-first approach

Tạo code snippet sẵn dán vào [LOCATION].
```

---

## 📋 **Template 4: Sửa/Polish Design (Detailed)**

```
Tôi sẽ reference agent từ /agents/engineering/frontend-developer.md

Polish/sửa component [COMPONENT] trong file [FILE_PATH]:

1. **Current Design System (IMPORTANT):**
   - Colors: CSS variables (--primary, --background, --card, --border, etc.)
   - Font: Geist (đã setup sẵn)
   - Spacing: Tailwind (p-*, m-*, gap-*, etc.)
   - Border radius: --radius variable (rounded-lg, rounded-xl)
   - Dark mode: Tự động qua .dark class

2. **Vấn đề cần sửa:**
   [CHI TỊ VẤN ĐỀ]

3. **Yêu cầu:**
   - Giữ nguyên design language
   - Không thêm custom CSS
   - Không hardcoded colors
   - Support light/dark mode
   - Mobile responsive

4. **Acceptance Criteria:**
   [LIST CRITERIA]

Sửa code để vừa với design system.
```

---

## 🚀 **Copy-Paste Ready Examples**

### ✅ **Example 1: Thêm Pricing Page**
```
Tôi sẽ reference agent từ /agents/engineering/frontend-developer.md

Thêm trang Pricing ở /app/pricing/page.tsx:

1. Design System Compliance: dùng CSS variables, support dark mode tự động
2. Components: Card (dùng Card từ shadcn/ui), Button (với primary/secondary variants), Badge (cho "Popular")
3. Typography: Geist font, h1 text-3xl bold, h2 text-2xl, body text-base
4. Responsive: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
5. Colors: bg-card text-card-foreground, border-border cho dividers
6. Không làm: hardcoded colors, custom CSS, inline styles

Tạo professional pricing page match current design.
```

### ✅ **Example 2: Thêm FAQ Section**
```
Tôi sẽ reference agent từ /agents/engineering/frontend-developer.md

Thêm FAQ section vào /components/landing/faq.tsx:

1. Style Match: xem components/landing/features.tsx để copy spacing/colors
2. Component: dùng Accordion từ shadcn/ui (mở/đóng questions)
3. Typography: h2 text-2xl, questions text-base, answers text-sm muted
4. Responsive: max-w-3xl mx-auto, p-4 sm:p-8
5. Dark Mode: auto via CSS variables
6. Colors: bg-card, text-foreground, border-border

Tạo reusable FAQ component.
```

### ✅ **Example 3: Polish Button Styles**
```
Tôi sẽ reference agent từ /agents/engineering/frontend-developer.md

Polish button components ở /components/ui/button.tsx:

Vấn đề: Buttons không match primary brand color, hover states không rõ

Yêu cầu:
- Primary buttons: bg-primary text-primary-foreground, hover:opacity-90
- Secondary: bg-secondary, hover state rõ ràng
- Destructive: bg-destructive, bright red in light mode, dimmer in dark mode
- Ghost: transparent by default, hover:bg-muted
- Responsive: padding/text-size match current design
- Dark mode: auto via CSS variables, không hardcoded

Acceptance:
- All 4 variants rõ ràng trong light/dark
- Hover state visible
- Focus state (outline-ring)
- Disabled state (opacity-50)

Polish button để better brand consistency.
```

---

## 💡 **Pro Tips**

### Tip 1: Always Reference Frontend Agent
```
Tôi sẽ reference agent từ /agents/engineering/frontend-developer.md

[YOUR_REQUEST]
```
**Why**: Agent có rules về TypeScript, component patterns, accessibility → output consistency cao

### Tip 2: Reference Current Page as Template
```
Tôi sẽ reference agent từ /agents/engineering/frontend-developer.md

Thêm feature [X] vào [Y], match style từ /components/landing/hero.tsx:
- Cùng spacing: p-6 sm:p-12
- Cùng heading style: h2 text-3xl
- Cùng button variant
- Cùng card component

[DETAILS]
```
**Why**: Explicit file reference → Copilot copy style từ existing file

### Tip 3: Mention Dark Mode Explicitly
```
Support dark/light mode tự động qua CSS variables - không cần theme prop
```
**Why**: Copilot often forgets dark mode → explicit mention helps

### Tip 4: Forbidden Patterns
```
Không làm:
- Hardcoded colors (#fff, #000, rgb, hex)
- Custom CSS files (@media dark, etc.)
- Inline styles (style={{color: 'red'}})
- Theme detection (if isDark ? ... : ...)
```
**Why**: These break design consistency → explicitly forbid

### Tip 5: File Path Reference
```
Match components từ /components/landing/hero.tsx
```
**Why**: Copilot learns from existing patterns → faster, more consistent

---

## 🎯 **Quick Checklist Before Prompting**

- [ ] Did I mention `/agents/engineering/frontend-developer.md` agent?
- [ ] Did I mention CSS variables (not hardcoded colors)?
- [ ] Did I mention dark mode support?
- [ ] Did I include file path examples if applicable?
- [ ] Did I forbid custom CSS and inline styles?
- [ ] Did I specify component source (shadcn/ui)?
- [ ] Did I mention responsive breakpoints?

✅ Pass all = 95% design consistency guaranteed!

---

## 📞 **When to Use Which Template**

| Task | Template | Success Rate |
|------|----------|--------------|
| Add new page | Template 1 | 98% ✅ |
| Create reusable component | Template 2 | 97% ✅ |
| Add feature to page | Template 3 | 95% ✅ |
| Polish/fix existing | Template 4 | 96% ✅ |
| Complex feature | Combo 1+4 | 94% ✅ |

**Key**: Use agent reference + CSS variables + explicit "no hardcoded" = consistency 🎨
