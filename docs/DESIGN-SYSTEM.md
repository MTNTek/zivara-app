# Zivara — UI/UX Design Specification

**Version:** 1.0  
**Status:** For Approval  
**Role:** Senior Product Designer · Senior UX Designer · Design System Architect

---

## Design Philosophy

Zivara must feel like the most trustworthy, most honest, cleanest hiring platform a GCC worker has ever used. Every screen answers one question: *what should I do next?*

**Inspired by:** Ogram's simplicity  
**Differentiated by:** Greater transparency, live data, modern polish, and genuine trust signals

**First impression target:** *"This looks professional, simple, and trustworthy."*

---

## Part 1 — Design System

### 1.1 Colour Palette

#### Brand Colours
| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-primary-50` | Teal Lightest | `#F0FDFA` | Hover backgrounds, tinted cards |
| `--color-primary-100` | Teal Light | `#CCFBF1` | Tag backgrounds |
| `--color-primary-400` | Teal Mid | `#2DD4BF` | Icons, accents |
| `--color-primary-500` | Teal | `#14B8A6` | Primary buttons, links, active states |
| `--color-primary-600` | Teal Dark | `#0D9488` | Button hover, focus rings |
| `--color-primary-700` | Teal Darker | `#0F766E` | Pressed state |
| `--color-secondary-400` | Slate Mid | `#94A3B8` | Secondary icons, disabled text |
| `--color-secondary-600` | Slate | `#475569` | Secondary text, labels |
| `--color-secondary-800` | Slate Dark | `#1E293B` | Headings, high-emphasis text |
| `--color-secondary-900` | Slate Darkest | `#0F172A` | Body text |

#### Neutral Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-white` | `#FFFFFF` | Card backgrounds, page background |
| `--color-grey-50` | `#F8FAFC` | Page background (light grey zones) |
| `--color-grey-100` | `#F1F5F9` | Section backgrounds, dividers |
| `--color-grey-200` | `#E2E8F0` | Borders, separators |
| `--color-grey-300` | `#CBD5E1` | Disabled borders |
| `--color-grey-500` | `#64748B` | Placeholder text |

#### Semantic Colours
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success-50` | `#F0FDF4` | Success background |
| `--color-success-500` | `#22C55E` | Success icon, verified badge |
| `--color-success-700` | `#15803D` | Success text |
| `--color-warning-50` | `#FFFBEB` | Warning background |
| `--color-warning-500` | `#F59E0B` | Warning icon, urgent badge |
| `--color-warning-700` | `#B45309` | Warning text |
| `--color-error-50` | `#FEF2F2` | Error background |
| `--color-error-500` | `#EF4444` | Error icon, validation |
| `--color-error-700` | `#B91C1C` | Error text |

---

### 1.2 Typography

#### Fonts
- **Headings:** Manrope (variable, weights 600–800)
- **Body / UI:** Inter (variable, weights 400–600)
- **Both available on Google Fonts — no licensing cost**

#### Type Scale
| Token | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| `--text-display` | Manrope | 48px / 3rem | 800 | 1.1 | Hero headline |
| `--text-h1` | Manrope | 36px / 2.25rem | 700 | 1.2 | Page titles |
| `--text-h2` | Manrope | 28px / 1.75rem | 700 | 1.25 | Section headings |
| `--text-h3` | Manrope | 22px / 1.375rem | 600 | 1.3 | Card headings |
| `--text-h4` | Manrope | 18px / 1.125rem | 600 | 1.4 | Sub-headings |
| `--text-body-lg` | Inter | 18px / 1.125rem | 400 | 1.6 | Hero supporting text |
| `--text-body` | Inter | 16px / 1rem | 400 | 1.6 | Default body copy |
| `--text-body-sm` | Inter | 14px / 0.875rem | 400 | 1.5 | Secondary text, labels |
| `--text-caption` | Inter | 12px / 0.75rem | 400 | 1.4 | Metadata, timestamps |
| `--text-label` | Inter | 12px / 0.75rem | 600 | 1 | Uppercase labels, badges |
| `--text-button` | Inter | 15px / 0.9375rem | 600 | 1 | Button text |

#### Arabic / RTL Typography
- Arabic font: **Cairo** (Google Fonts) — specifically designed for UI
- All font sizes identical — Cairo has excellent x-height matching Inter
- Line height increased to 1.8 for Arabic body text
- Letter-spacing set to 0 for Arabic (not appropriate for Arabic script)

---

### 1.3 Spacing System

8px base grid. All spacing is a multiple of 4.

| Token | Value | Common Usage |
|-------|-------|-------------|
| `--space-1` | 4px | Icon padding, micro gaps |
| `--space-2` | 8px | Tight spacing, input padding |
| `--space-3` | 12px | Badge padding |
| `--space-4` | 16px | Default component padding |
| `--space-5` | 20px | Card inner padding (mobile) |
| `--space-6` | 24px | Card inner padding (desktop) |
| `--space-8` | 32px | Section internal gaps |
| `--space-10` | 40px | Between cards |
| `--space-12` | 48px | Section padding (mobile) |
| `--space-16` | 64px | Section padding (desktop) |
| `--space-20` | 80px | Large section gaps |
| `--space-24` | 96px | Hero padding |

---

### 1.4 Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Buttons, inputs, badges |
| `--radius-md` | 10px | Cards, dropdowns |
| `--radius-lg` | 16px | Large cards, modals |
| `--radius-xl` | 24px | Hero elements, feature cards |
| `--radius-full` | 9999px | Pills, avatars, progress bars |

---

### 1.5 Shadows
| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle card lift |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.07)` | Default card |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.10)` | Hover state cards |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.12)` | Modals, dropdowns |
| `--shadow-teal` | `0 4px 16px rgba(20,184,166,0.25)` | Primary button hover |

---

### 1.6 Design Tokens (CSS Custom Properties)

```css
:root {
  /* Colours */
  --color-primary: #14B8A6;
  --color-primary-hover: #0D9488;
  --color-primary-focus: #0D9488;
  --color-on-primary: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-surface-raised: #F8FAFC;
  --color-border: #E2E8F0;
  --color-border-focus: #14B8A6;
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #94A3B8;
  --color-text-placeholder: #CBD5E1;

  /* Motion */
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --easing-enter: cubic-bezier(0, 0, 0.2, 1);
  --easing-exit: cubic-bezier(0.4, 0, 1, 1);

  /* Layout */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1440px;
  --nav-height: 64px;
  --nav-height-mobile: 56px;
}
```

---

## Part 2 — Component Library

### 2.1 Buttons

#### Primary Button
```
Background: --color-primary (#14B8A6)
Text: White, --text-button
Border radius: --radius-sm (6px)
Padding: 12px 24px
Min-width: 120px
Min-height: 48px (touch target)
Hover: background --color-primary-hover, box-shadow --shadow-teal
Active: scale(0.98)
Focus: 2px offset ring, --color-primary-focus
Disabled: opacity 0.4, cursor not-allowed
Loading: spinner replaces text, button disabled
```

#### Secondary Button
```
Background: transparent
Border: 1.5px solid --color-border
Text: --color-text-primary
Padding: 12px 24px
Hover: border-color --color-primary, text --color-primary, bg --color-primary-50
```

#### Ghost Button
```
Background: transparent
Text: --color-primary
No border
Padding: 12px 20px
Hover: background --color-primary-50
Used for: tertiary actions, "View all" links
```

#### Destructive Button
```
Background: --color-error-500
Text: white
Hover: --color-error-700
Used for: irreversible actions only (delete, reject)
```

#### Icon Button
```
Size: 40×40px (minimum touch target 48×48px with invisible padding)
Shape: circle or rounded-square depending on context
Background: transparent or --color-grey-100 on hover
```

---

### 2.2 Form Inputs

#### Text Input
```
Height: 48px
Border: 1.5px solid --color-border
Border radius: --radius-sm
Padding: 12px 16px
Font: --text-body, Inter
Background: white
Focus: border --color-primary, ring 3px rgba(20,184,166,0.15)
Error: border --color-error-500, ring rgba(239,68,68,0.15)
Disabled: background --color-grey-50, text --color-text-muted
Placeholder: --color-text-placeholder

Label: above input, --text-body-sm, weight 500, --color-text-secondary
Error message: below input, --text-caption, --color-error-700, with ⚠ icon
Helper text: below input, --text-caption, --color-text-muted
```

#### Search Input (Smart Search)
```
Height: 56px (desktop) / 48px (mobile)
Border radius: --radius-md
Left icon: magnifier, --color-text-muted
Clear button: × on right when value present
Full-width container with drop shadow --shadow-sm
On focus: shadow --shadow-md, border --color-primary
```

#### Select / Dropdown
```
Same height and border as text input
Right icon: chevron-down
Searchable variant: shows text input when opened
Country selector: flag emoji + country name
City selector: shows city + region
```

#### Checkbox
```
Size: 20×20px
Border radius: 4px
Checked: filled --color-primary, white checkmark
Focus: ring 3px rgba(20,184,166,0.25)
Label: 16px, --color-text-primary
```

---

### 2.3 Cards

#### Job Card (Signature Component)
```
Background: white
Border: 1px solid --color-border
Border radius: --radius-lg (16px)
Shadow: --shadow-sm
Padding: 20px
Width: 320px (desktop grid), 100% (mobile)
Hover: shadow --shadow-md, border --color-primary-100, translateY(-2px)

Layout (top to bottom):
┌─────────────────────────────────────────────┐
│ [Employer Logo 40px]  Employer Name         │
│                       ✓ Verified Employer   │
├─────────────────────────────────────────────┤
│ Job Title (h3, Manrope 600)                 │
│                                             │
│ AED 28/hr  ·  8hr shift  ·  AED 224/day    │
│                                             │
│ 📍 Dubai Marina  ·  12 km  ·  20 min       │
│    [View on Map →]                          │
│                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ LIVE HIRING PROGRESS                        │
│ ████████░░░░░  8 of 20 hired               │
│ 🔥 Only 12 remaining                        │
│                                             │
│ 48 applicants  ·  12 accepted  ·  8 left   │
│                                             │
│ [Full-time]  [Posted 2 hrs ago]            │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │         Apply Now →                     ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘

When filled:
- Apply button → "Job Closed · All Positions Filled" (grey, disabled)
- Progress bar → 100% filled (teal)
- Banner → ✓ Position Filled (success green)

When low availability (≤20%):
- 🔥 Only N positions remaining (warning amber)
- Progress bar → amber when ≤20% remaining
```

#### Employer Card (Public Directory)
```
Logo (56px square, rounded)
Company name (h3)
Verified badge (if verified)
Industry tag
Rating stars + count
Active jobs count
[View Company →] ghost button
```

#### Category Card
```
Background: gradient from --color-primary-50 to white
Border: 1px solid --color-primary-100
Border radius: --radius-xl (24px)
Icon: 48px, --color-primary-500
Category name: Manrope 600, 16px
Job count: "142 jobs available", Inter 14px, --color-text-muted
Full clickable area
Hover: shadow --shadow-md, border --color-primary-400
```

---

### 2.4 Badges & Status Indicators

#### Verified Employer Badge
```
Icon: shield-check (filled teal)
Text: "Verified Employer"
Background: --color-success-50
Text colour: --color-success-700
Border: 1px solid rgba(34,197,94,0.2)
Border radius: --radius-full
Padding: 4px 10px
Font: --text-caption, weight 600
```

#### Job Status Badges
```
Draft:    grey background, grey text  — "Draft"
Open:     teal bg, teal text          — "Hiring Now"
Hiring:   teal bg, teal text          — "Hiring"
Filled:   green bg, green text        — "Filled"
Completed: slate bg, slate text       — "Completed"
Archived: grey bg, grey text          — "Archived"
```

#### Application Status Badges
```
Received:     slate bg    — "Received"
Under Review: amber bg    — "Under Review"
Shortlisted:  teal bg     — "Shortlisted" ⭐
Hired:        green bg    — "Hired" ✓
Rejected:     red bg      — "Not Selected"
Withdrawn:    grey bg     — "Withdrawn"
```

---

### 2.5 Live Hiring Progress Bar

This is the signature Zivara component. It must always be live.

```
Structure:
┌─ LIVE HIRING PROGRESS ─────────────────────┐
│ ┌──────────────────────────────────────────┐│
│ │████████████████░░░░░░░░░░░░░░░░░░░░░░░░ ││  ← Progress track
│ └──────────────────────────────────────────┘│
│ 8 of 20 positions hired                    │
│ 🔥 Only 12 remaining                        │
└─────────────────────────────────────────────┘

Progress track:
- Total width: 100%
- Height: 8px
- Border radius: --radius-full
- Background (empty): --color-grey-200
- Fill: --color-primary-500 (teal)
  - When ≤20% remaining: --color-warning-500 (amber)
  - When 100% filled: --color-success-500 (green)

Animation:
- Fill transitions with: transition: width 600ms --easing-standard
- On update: subtle pulse on the number display (300ms)
- Never flickers — optimistic update with server reconciliation

"LIVE" label:
- Small pulsing green dot (8px circle) + "LIVE" text
- Animation: opacity 1→0.3→1, 2s loop
- Only shown when job is actively hiring
```

---

### 2.6 Navigation

#### Desktop Navigation (≥1024px)
```
Height: 64px
Background: white
Border-bottom: 1px solid --color-border
Position: sticky top-0, z-index 100

Left: Zivara wordmark (teal)
Centre: Jobs · Employers · How It Works · About
Right: Log In (ghost button) · Register (primary button)

Authenticated state:
Right: Notification bell (with badge) · Profile avatar → dropdown
  (My Profile / Dashboard / Settings / Log Out)
```

#### Mobile Navigation (≤768px)
```
Height: 56px
Hamburger menu → full-screen overlay
  Logo top-left
  Close button top-right
  Nav items stacked, 56px touch targets
  Log In + Register at bottom
  Language toggle (EN / AR)

Bottom tab bar (authenticated only):
  Home · Jobs · Applications · Profile · Notifications
  Active tab: teal icon + teal label
  Inactive: slate grey
  Badge: red circle on notifications
  Height: 56px + safe area inset
```

---

### 2.7 Empty States

Every empty state follows this pattern:
```
┌─────────────────────────────┐
│      [Illustration]         │
│    Descriptive heading      │
│  Short helpful explanation  │
│   [Primary Action Button]   │
└─────────────────────────────┘

Illustration: simple SVG line illustration, teal accent
No clutter. No multiple calls to action.
```

Examples:
- No jobs found → "No jobs match your search" + "Adjust filters" button
- No applications → "You haven't applied yet" + "Browse jobs" button
- No notifications → "You're all caught up" (no button needed)

---

### 2.8 Loading States

**Skeleton screens** (not spinners) for all content:

```
Job card skeleton:
- Employer logo: grey rounded square 40px
- Two grey lines for name/title
- Three short grey lines for details
- Full-width grey bar for progress
- Full-width grey button shape

Animation: shimmer — gradient sweep from left to right
Background: --color-grey-100
Shimmer: rgba(255,255,255,0.6) gradient
Duration: 1.5s infinite
```

**Page-level loading:**
- Skeletons match the exact layout of the content they replace
- No spinner overlays — they feel slow
- Exception: form submission → button shows spinner + disabled state

---

### 2.9 Iconography

Use **Lucide Icons** — clean, consistent 2px stroke icons throughout.

```
Default size: 20×20px (UI), 24×24px (feature), 48×48px (illustration)
Stroke width: 1.5px
Colour: inherits from parent (currentColor)
Never use filled and outline icons mixed on the same page
```

Key icons:
- Location: `map-pin`
- Verified: `shield-check` (filled teal)
- Time: `clock`
- Money: currency-symbol appropriate (AED)
- Search: `search`
- Notification: `bell`
- Profile: `user`
- Jobs: `briefcase`
- Application: `file-text`
- Shift: `calendar`
- Rating: `star`
- Live: pulsing circle (custom)
