# UI/UX & Design System (V1.1 - Auditor Sync)

The Coastal Banking System employs a **Premium, High-Contrast Glassmorphic** design system, engineered for institutional trust and operational efficiency.

---

## 🏛️ 1. Design Philosophy
**"Trust through Transparency and Precision."** 
The design system avoids generic "SaaS" aesthetics in favor of a **High-Contrast, Slate-Focused** interface that ensures readability and reduces operational error.

---

## 🎨 2. Color Palette & Typography

### Base Colors (The "Slate-Black" Standard)
- **Primary Text**: `slate-900` (`#0f172a`) — **Mandatory** for all data-carrying text.
- **Accent Text**: `black` — Used for ultra-high-contrast headers and key numbers.
- **Backgrounds**: `slate-50` with subtle **glassmorphic overlays**.
- **Success/Warning/Error**: Industrial standard hues (Emerald-600, Amber-600, Rose-600).

### Typography (Self-Hosted Strategy)
- **Loading Strategy**: All fonts are **Self-Hosted** within the asset bundle (e.g., `public/fonts/`) to ensure **100% Data Residency** compliance and **Offline Resilience** during network instability.
- **Headings**: *Outfit* (Google Fonts - Open Source).
- **Data Tables**: *Inter* (Google Fonts - Open Source).
- **Monospaced**: *JetBrains Mono* (JetBrains - Open Source).

---

## 💎 3. Structural Design Patterns (Glassmorphism)

### Premium Glassmorphic Spec (`black/5`)
All dashboard cards and containers use a consistent glassmorphic spec:
- **Background**: `bg-white/40` with a **High-Contrast Tint Overlay** (Semi-opaque white) to satisfy WCAG 2.1 contrast guidelines.
- **Blur**: `backdrop-blur-xl`.
- **Border**: `border border-black/5` — Subtle, premium definition.
- **Secondary Border**: `border-white/20` (Inner stroke) for depth.
- **Shadow**: Low-profile, wide-spread shadows for depth without noise.

### 🧩 3.1 Performance Guardrails
To ensure stability on entry-level mobile devices used by field bankers, expensive visual effects are gated:
```css
@media (prefers-reduced-motion), (max-resolution: 150dpi) {
  .glass-card {
    backdrop-filter: none;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}
```

---

## 🧩 4. Unified Operational Hubs
The front end uses a **Global Hub Architecture** to manage state and navigation:
- **AdministrativeHub**: High-density tables with slate-900 text.
- **FinancialOperationsHub**: Visual analytics for payroll and cash flow.
- **OnboardingHub**: Deep-modal workflows for applicant vetting.
- **SupportHub**: Real-time ticket management with high-contrast badges.

---

## 📱 5. Mobile-First Mobile Banking
The **Mobile Banker Dashboard** is designed for high-stress, field-use:
- **Interaction**: Large touch targets (min 44px) for cash collection and biometric entry.
- **Constraint**: Field agent apps are constrained to a mobile-phone aspect ratio for consistency across entry-level devices.
- **Roadmap (Phase 2)**: Full **Offline-First PWA** integration (including Service Workers, IndexedDB for `TransactionQueue`, and Automatic Conflict Resolution) is scheduled for **Q4 2026** to support ultra-remote operations.

---

## ⚠️ 6. Error States & Skeletons
- **Form Validation**: Inline errors using `Rose-600` with descriptive iconography.
- **Empty States**: High-contrast slate illustrations with "Maker-Checker" status visibility.
- **Loading Strategy**: Component-level **Skeletons** (`bg-slate-200/50` animate-pulse) to reduce perceived latency.

---

## 🖨️ 7. Print Architecture
Banking documents are styled for professional distribution:
- **Statements & Loan Documents**: Print-optimized CSS (`@media print`) that removes glassmorphism, hides navigation, and forces **High-Contrast (Black on White)** for laser-printing efficiency.

---

## ♿ 8. Accessibility (WCAG 2.1 AA)
- **Contrast**: All data-carrying text maintains a **4.5:1 (AA)** minimum contrast ratio.
- **Focus States**: Clear indigo focus rings on all interactive elements.
- **Screen Readers**: Semantic HTML5 tags (`<main>`, `<nav>`, `<aria-label>`) used throughout.
- **Fallback**: "High Contrast Mode" setting that removes transparency for users with visual impairments.

---

## 🔒 9. Security UX (Transparent Trust)

### Maker-Checker UI Indicators
- **Pending Approval**: Coded in **Amber/600** with a clear "Awaiting Manager Sign-off" label.
- **Processed**: High-contrast slate data with a green "Dual-Identity Verified" badge.
- **Audit Transparency**: A real-time **Audit Feed** is integrated into administrative views.

---

## 🌙 10. Dark Mode Strategy

- **Strategy**: Tailwind `class` based (`darkMode: 'class'`).
- **Initialization**: `prefers-color-scheme` initial detection with manual toggle overrides.
- **Persistence**: **Persistent** via `localStorage` (key: `coastal-theme`).

### Dark Palette
- **Primary Text**: `slate-100` (`#f1f5f9`).
- **Backgrounds**: `slate-900` / `slate-800` (Surface layering).
- **Glassmorphic Inversion**: Cards swap to **`bg-black/40`** with adjusted `border-white/10` to ensure visibility against dark surfaces.
- **Status Indicators**: Desaturated versions (Emerald-400, Amber-400, Rose-400) for eye-comfort.

---

** coastal.banking // ui-architect-v1.1 // zero-friction / high-trust / dark-ready **
