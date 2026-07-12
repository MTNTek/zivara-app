# Zivara — UX & Page Specifications

**Version:** 1.0 | **Status:** For Approval

---

## Part 3 — Homepage Wireframe & Specification

### 3.1 Navigation Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│  🟦 Zivara      Jobs  Employers  How It Works  About    Log in  [Register] │
└─────────────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- Transparent on scroll position 0, white background once scrolled 10px
- Active nav item: teal underline (2px, animated)
- Register button: primary teal
- Log in: ghost (text only, no border)
- Language toggle (EN / AR) — far right, compact

---

### 3.2 Hero Section

**Layout:** Full-width, white background, centred content

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│     Find Trusted Work.                                              │
│     Hire Trusted People.                                            │
│                                                                     │
│     The GCC's most transparent workforce marketplace.              │
│     Verified employers. Real-time hiring. Fair pay.                 │
│                                                                     │
│     [  Find Jobs  ]    [  Hire Workers  ]                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Typography:**
- Headline: Manrope 800, 48px desktop / 32px mobile, slate-900
- Sub-headline: Inter 18px, slate-600, max-width 560px, centred

**Buttons:**
- "Find Jobs" → primary (teal)
- "Hire Workers" → secondary (white with teal border)
- Side by side desktop, stacked mobile
- 48px height, minimum touch target

**Background:**
- White base
- Subtle teal gradient arc at bottom edge of hero
- No photography — illustration or clean geometric shapes only
- Optional: floating verified badge and job card snippets (not animated, static)

---

### 3.3 Smart Search Bar

Placed immediately below the hero, full-width container with max-width 800px centred.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🔍  Job title, skill, or company name                                  │
├───────────────────────────────────────┬─────────────────────────────────┤
│  🌍  Country               ▾         │  🏙  City                 ▾    │
└───────────────────────────────────────┴─────────────────────────────────┘
                  [ Use My Current Location  📍 ]
                  ─────────────────────────────────────────
                     [          Search Jobs          ]
```

**Design details:**
- Outer container: white, --shadow-md, --radius-xl
- Three inputs: keyword (full width top), country + city (50/50 bottom row)
- All inputs: 48px height, no borders between them (seamless)
- Dividers: 1px --color-border internal lines
- Country selector: searchable with flag emoji, default to "UAE"
- City selector: populates based on selected country, searchable
- "Use My Current Location" link: below the search box
  - Teal text, map-pin icon
  - On click: shows a tooltip explaining the benefit BEFORE requesting permission
  - Tooltip: "Allow location to see jobs near you and estimated travel time"
  - Two options: "Allow" | "Not now" — never forces, never guilt-trips
- Search button: full-width, 52px, primary teal

**Empty state:**
- Shows recent searches (if returning user)
- Shows trending searches in GCC

---

### 3.4 Popular Categories

```
┌─────────────────────────────────────────────────────────────┐
│            Browse by Industry                               │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────┤
│ 🏗        │ ☀        │ 🏨        │ 🧹        │ 🏠        │ 📚  │
│Constructi│  Solar   │Hospitali-│ Cleaning │Domestic  │Priv │
│  on      │  Energy  │  ty      │          │Services  │Tutor│
│ 142 jobs │ 38 jobs  │ 89 jobs  │ 67 jobs  │ 54 jobs  │24 j │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────┘
```

**Card spec:**
- Desktop: 6 cards in a row, max 1200px container
- Mobile: 2 columns, scrollable horizontally as chips on small screens
- Each card: icon (48px emoji or SVG), name, live job count
- Teal tint background, white card face
- Hover: lift + teal border glow

---

### 3.5 Featured Jobs

```
Section header: "Featured Jobs" + "View all jobs →" right-aligned

[ Job Card ]  [ Job Card ]  [ Job Card ]  [ Job Card ]
                                        → Scroll (mobile)
```

**Desktop:** 4-column grid  
**Tablet:** 2-column grid  
**Mobile:** 1 column, full width, vertically stacked

See **Job Card specification** in Part 2 (Section 2.3) for complete card anatomy.

**Live updates:**
- Hiring progress bars update via WebSocket / Server-Sent Events
- No full page refresh
- Smooth bar animation on change (600ms ease)
- Number updates with a brief highlight pulse (200ms amber → normal)

---

### 3.6 Why Choose Zivara

**5 trust pillars, horizontal cards:**

```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ ✓ Verified │ │ 👁 Transpar│ │ 🔴 Live    │ │ ⚡ Fast     │ │ ⭐ Trusted  │
│ Employers  │ │ ent Hiring │ │ Progress   │ │Applications│ │ Platform   │
│            │ │            │ │            │ │            │ │            │
│ Every comp-│ │ See exactly│ │ Know how   │ │ Apply in   │ │ Verified   │
│ any is ID  │ │ how many   │ │ many spots │ │ under 2    │ │ IDs, rated │
│ verified.  │ │ positions  │ │ remain.    │ │ minutes.   │ │ reviews.   │
│            │ │ are left.  │ │            │ │            │ │            │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
```

**Mobile:** horizontal scroll, snap-to-card

---

### 3.7 How It Works

**Two tabs:** For Professionals | For Employers

**Professionals:**
```
1. Create your profile (2 minutes)
2. Find and apply for verified jobs
3. Confirm your shift and get paid
```

**Employers:**
```
1. Register and verify your company
2. Post a job in under 3 minutes
3. Review applications and hire
```

Each step: large number (teal), icon, bold headline, short description.

---

### 3.8 Statistics Bar

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  2,847       │  18,421      │  312         │  9,104       │
│  Active Jobs │ Professionals│  Employers   │  Successful  │
│              │              │              │  Hires       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- Numbers animate up from 0 when section enters viewport (once only)
- Background: slate-900 (dark band)
- Text: white
- Separator: vertical 1px white with 20% opacity

---

### 3.9 Testimonials

3 testimonials, 3-column desktop, single carousel mobile.

```
┌────────────────────────┐
│ ⭐⭐⭐⭐⭐               │
│ "Quote in 1-2 sentences│
│  that is honest and     │
│  specific."             │
│                         │
│ [Avatar] Name           │
│          Role · Country │
└────────────────────────┘
```

- Professional AND employer testimonials mixed
- No stock photos — avatars with initials if no photo
- Simple, no carousel dots on desktop (just three cards)

---

### 3.10 Footer

```
┌─────────────────────────────────────────────────────────┐
│  🟦 Zivara                                               │
│  The GCC's most trusted workforce marketplace.          │
│                                                         │
│  Platform        Company         Support                │
│  Jobs            About           Help Centre            │
│  For Employers   Careers         Contact Us             │
│  How It Works    Privacy Policy  Terms of Service       │
│                                                         │
│  EN | AR        © 2025 Zivara. All rights reserved.    │
└─────────────────────────────────────────────────────────┘
```

- Background: slate-900
- Text: white (primary), slate-400 (secondary)
- No social media icons unless accounts are active
- Minimal — 3 columns max

---

## Part 4 — Professional Dashboard

**Design question answered by every screen:** *"What should I do today?"*

### 4.1 Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Navigation (persistent)                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Good morning, Mohammed 👋                                   │
│                                                              │
│  ┌──────────────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ Profile Completeness │  │Applications│  │ Upcoming   │   │
│  │ ████████░░ 80%       │  │     3      │  │  Shifts    │   │
│  │ + Complete profile   │  │            │  │    1       │   │
│  └──────────────────────┘  └────────────┘  └────────────┘   │
│                                                              │
│  Recommended for you ──────────────────────────────────      │
│  [ Job Card ]  [ Job Card ]  [ Job Card ]  → View all       │
│                                                              │
│  My Applications ──────────────────────────────────────      │
│  [ Latest 3 applications with status badges ]               │
│                                                              │
│  Upcoming Shifts ──────────────────────────────────────      │
│  [ Next shift card: date, location, role, confirm button ]  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Profile completeness:**
- Prominent when < 100% — it directly affects job recommendations
- Shows exactly what's missing: "Add a photo +10%", "Add a skill +15%"
- Teal progress bar, green when complete
- Disappears from top once 100% (moves to profile page only)

**Recommended jobs:**
- Based on profile industry, skills, and location
- Never shows closed/filled jobs
- Refreshes daily

---

## Part 5 — Employer Dashboard

**Design focus:** Hiring activity at a glance.

### 5.1 Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Good morning, Al Fardan Construction 👋                     │
│  ✓ Verified Employer                                         │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Active  │ │ New Apps │ │ Workers  │ │  Today's     │   │
│  │   Jobs   │ │  Today   │ │on Shift  │ │  Hirings     │   │
│  │    5     │ │   28     │ │   12     │ │     4        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                                                              │
│  [ Post a new job ]  ← always visible primary CTA           │
│                                                              │
│  Active Jobs ──────────────────────────────────────────      │
│  Each job shows mini hiring progress bar                    │
│  [ Job row ]  8/20 hired  ████░░  [View apps] [Close]       │
│  [ Job row ]  20/20 hired ██████  FILLED      [Archive]     │
│                                                              │
│  Recent Applications ──────────────────────────────────      │
│  Latest 5 applications across all jobs                      │
│  [ Name · Job · Status · Time ]                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Hiring progress on dashboard:**
- Every active job shows its mini progress bar
- Filled jobs are visually distinct (green border, filled badge)
- One-click to "Post a job" always visible — never buried

---

## Part 6 — Admin Dashboard

### 6.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Zivara Admin  ·  Mohammed Al Rashidi (Admin)  ·  Log out   │
├───────────────┬──────────────────────────────────────────────┤
│ Sidebar:      │                                              │
│ Dashboard     │  Platform Health ─────────────────────────── │
│ Verifications │  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│ Users         │  │ ⚠ 3     │ │ ⚠ 2     │ │ 🔴 1        │   │
│ Disputes      │  │Pending  │ │Flagged  │ │ Fraud Alert │   │
│ Ratings       │  │Verif.   │ │Ratings  │ │             │   │
│ Analytics     │  └─────────┘ └─────────┘ └─────────────┘   │
│ Audit Log     │                                              │
│               │  Verification Queue ───────────────────────  │
│               │  [ Professional: Name · Submitted · Approve/Reject ]│
│               │  [ Employer: Company · License · Approve/Reject ]  │
│               │                                              │
│               │  Recent Activity ──────────────────────────  │
│               │  Audit trail of last 20 admin actions        │
└───────────────┴──────────────────────────────────────────────┘
```

- Sidebar: slate-900 background, white text
- Active item: teal left border + teal text
- Alert counts: red badges on sidebar items
- All destructive actions (suspend, reject) require confirmation dialog with reason field

---

## Part 7 — Job Lifecycle Visual States

Every job has a visual state that is immediately clear.

```
DRAFT    → Grey badge. "Draft" label. Not visible to professionals.
OPEN     → Teal badge. "Hiring Now" label. Hiring progress shown.
HIRING   → Teal badge + live dot. Progress bar animating.
FILLED   → Green badge. "All Positions Filled". Apply disabled.
COMPLETED→ Slate badge. "Work Completed". Shift confirmed.
ARCHIVED → Grey badge. "Archived". Not visible on public pages.
```

**Visual weight hierarchy:**
- Filled and Completed jobs: reduced visual weight (greyed out card)
- Open/Hiring: full colour card
- Draft: dashed border, "Preview" chip

---

## Part 8 — Search Experience

### 8.1 Search Results Page

```
┌─ Filters (left sidebar, 260px) ─────┬─ Results ─────────────────────────┐
│                                     │                                   │
│ Sort by: Relevance ▾                │ 234 jobs found for "Scaffolding"  │
│                                     │                                   │
│ INDUSTRY            ───────────     │ [ Job Card ]  [ Job Card ]       │
│ ☐ Construction (89)                │ [ Job Card ]  [ Job Card ]       │
│ ☐ Hospitality (34)                 │ [ Job Card ]  [ Job Card ]       │
│ ☐ Solar Energy (12)                │                                   │
│                                     │ Load more ↓                      │
│ EMPLOYMENT TYPE     ───────────     │                                   │
│ ○ All                               └───────────────────────────────────┘
│ ○ Full-time
│ ○ Part-time
│ ○ Shift-based
│ ○ Contract

│ HOURLY RATE         ───────────
│ Min: AED [___]  Max: AED [___]

│ VERIFIED EMPLOYER   ───────────
│ ☐ Verified only

│ [Clear filters]   [Apply]
```

**Mobile:** Filters hidden behind a "Filters" button (bottom sheet).

**Advanced filters:** Hidden behind "More filters →" link. Only show when requested.

**No results state:**
```
[Illustration]
No jobs match your search
Try:  • A different job title
      • A nearby city
      • Removing some filters
[Clear all filters]
```

---

## Part 9 — Mobile Experience

### 9.1 Core Principles

- **One-handed use:** Primary actions within thumb reach (bottom of screen)
- **Minimal typing:** Pickers, selectors, and chips preferred over text input
- **Large touch targets:** Minimum 48×48px, prefer 56px for primary actions
- **Bottom navigation:** 5 tabs — Home, Jobs, Applications, Shifts, Profile
- **Back navigation:** always available, consistent across platform

### 9.2 Mobile Homepage

```
┌────────────────────────────────┐
│  Zivara                 🔔 👤  │  ← 56px nav
├────────────────────────────────┤
│                                │
│  Find Trusted Work.            │
│  Hire Trusted People.          │
│                                │
│  [  Find Jobs  ] [  Hire  ]   │
│                                │
│  ┌────────────────────────┐   │
│  │ 🔍 Search jobs...       │   │
│  └────────────────────────┘   │
│  📍 Dubai, UAE ▾              │
│                                │
├────────────────────────────────┤
│  Categories  ──────────────→  │
│  [Const.] [Solar] [Hosp.] >   │  ← horizontal scroll
│                                │
├────────────────────────────────┤
│  Featured Jobs                 │
│  [ Full-width Job Card ]       │
│  [ Full-width Job Card ]       │
│  [ See all jobs ]              │
│                                │
└────────────────────────────────┘
│ Home  Jobs  Apps  Shifts Profile│  ← bottom tab bar 56px
└────────────────────────────────┘
```

### 9.3 Mobile Job Card

```
┌────────────────────────────────┐
│ [Logo] Company Name  ✓ Verified│
│                                │
│ Job Title (18px, Manrope 600)  │
│ AED 28/hr · 8hrs · AED 224/day │
│ 📍 Dubai · 12km · 20 min       │
│                                │
│ ████████░░░░  8/20 hired       │
│ 🔥 Only 12 spots left          │
│                                │
│ [        Apply Now         ]   │  ← 48px height, full width
└────────────────────────────────┘
```

---

## Part 10 — Google Maps Integration UX

### 10.1 Location Permission Flow

```
[Step 1 — Explain benefit first]
┌─────────────────────────────────────────────┐
│  📍 See how far you are from each job       │
│                                             │
│  Allow location access to:                  │
│  • See distance from each job               │
│  • Get estimated travel time                │
│  • Find jobs in your area                   │
│                                             │
│  [Allow location]    [Use city instead]     │
└─────────────────────────────────────────────┘

NEVER show the browser GPS dialog first.
Always explain the benefit. Always offer an alternative.
```

### 10.2 Map View on Job Card

```
"View on Map →" link opens:
- Google Maps embed (API)
- Employer location pinned
- User's location (if granted) as starting point
- Shows route and travel time
- Sheet/modal on mobile, inline on desktop
```

### 10.3 Distance Without GPS

```
If no GPS:
- Use selected city centroid as reference
- Display "Distance from [City]" rather than "X km away"
- Show "📍 Based on Dubai" note under distance
```

---

## Part 11 — Interaction Guidelines

### 11.1 Motion Principles
- **Purposeful:** Every animation has a reason
- **Fast:** Duration 120–300ms for UI feedback, never longer
- **No bounce/spring on data changes** — reserved for celebratory moments only
- **Respect `prefers-reduced-motion`:** All animations disabled if requested

### 11.2 Feedback Patterns
| Action | Feedback |
|--------|---------|
| Button click | Ripple + scale(0.98), 120ms |
| Form submit | Button → loading spinner, disable input |
| Success | Green checkmark replaces content, 300ms fade |
| Error | Red banner slides down from top, 200ms |
| Live update | Number pulses (amber highlight → normal, 300ms) |
| Hiring progress bar update | Smooth width transition, 600ms |
| Applied successfully | Confetti burst (single, tasteful), success message |

### 11.3 Microinteractions
- **Star rating selector:** Stars fill left-to-right on hover
- **Apply button:** Changes to "Applied ✓" with green check on success
- **Notification bell:** Subtle shake when new notification arrives
- **Profile photo upload:** Drag + drop with border highlight

---

## Part 12 — Accessibility Guidelines

### 12.1 WCAG 2.1 AA Requirements
- Colour contrast: minimum 4.5:1 for body text, 3:1 for large text
- All interactive elements have focus states (visible ring)
- Skip-to-main-content link (hidden until focused)
- ARIA labels on all icon buttons
- Form errors announce via `aria-live="assertive"`
- Notification count on bell icon: `aria-label="3 unread notifications"`

### 12.2 RTL Support
- `dir="rtl"` on `<html>` for Arabic
- All flex directions reverse via `rtl:flex-row-reverse`
- Icons that indicate direction flip (arrows, chevrons)
- Text alignment flips
- Progress bar fills from right-to-left
- Maps maintain LTR (standard)
- Numbers and dates: always LTR regardless of page direction

### 12.3 Keyboard Navigation
- Tab order: logical, top-to-bottom, left-to-right
- All interactive elements reachable by keyboard
- Modal traps focus (no escaping via Tab)
- Escape closes modals and dropdowns
- Enter activates buttons and links
- Arrow keys navigate dropdown menus

---

## Part 13 — Responsive Breakpoints

```
Mobile:   320px – 767px   (1 column, full-width cards)
Tablet:   768px – 1023px  (2 columns)
Desktop:  1024px – 1279px (3-4 columns, sidebar appears)
Wide:     1280px+         (max-width 1440px container, centred)
```

**Grid system:**
- Mobile: 4-column grid, 16px gutters
- Tablet: 8-column grid, 24px gutters
- Desktop: 12-column grid, 32px gutters

---

## Part 14 — Future Design Scalability

The system is designed to extend without redesign:

| Future Feature | Design Accommodated By |
|----------------|------------------------|
| Payments UI | Transaction history component slot in dashboards |
| Mobile App | All components designed at 48px touch targets |
| Chinese language | Font slot: Noto Sans SC, same scale |
| Dark mode | CSS custom properties support light/dark swap |
| Ratings visible on cards | Star component already specified |
| Video profiles | Media card variant in component library |
| Chat/messaging | Notification system + badge component extensible |
| Multiple GCC countries | Country selector + locale-aware number formatting |

---

## Approval Checklist

Before implementation begins, confirm:

- [ ] Colour palette approved
- [ ] Typography approved (Manrope + Inter)
- [ ] Job card design approved (signature component)
- [ ] Live hiring progress bar approved
- [ ] Homepage section order approved
- [ ] Navigation structure approved
- [ ] Mobile navigation (bottom tabs) approved
- [ ] GPS / location permission flow approved
- [ ] Dashboard layouts approved (Professional / Employer / Admin)
- [ ] RTL/Arabic approach approved

**Upon full approval:** Implementation begins with the design system tokens and core components first, then pages in order of user priority.
