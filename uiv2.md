# UI V2 Design Specification

## Objective

Redesign ONLY the public-facing portfolio website.

The goal is to transform the current portfolio into a premium, cinematic, scroll-driven experience while preserving all existing functionality.

The redesign must improve the visual experience without changing how the application works.

---

# Scope

## Modify

- Public portfolio UI
- Components
- Layout
- Animations
- Typography
- Colors
- Spacing
- Responsive behavior
- Visual hierarchy
- User experience

## Do NOT modify

- Admin Panel
- Backend
- Database
- Authentication
- API routes
- CRUD logic
- Models
- Existing API integrations
- Business logic

Everything inside the admin panel should remain exactly as it is.

---

# Existing Architecture

The backend already provides all required data.

Do NOT hardcode:

- Hero content
- About content
- Profile image
- Skills
- Experiences
- Education
- Projects
- Certificates
- Achievements
- Contact information
- Social links
- Any editable text

Continue consuming data using the existing API and frontend architecture.

Only redesign how the data is presented.

---

# Design Philosophy

This portfolio should feel like an experience rather than a document.

Every section should tell part of a story.

Scrolling should feel intentional.

Animations should support storytelling instead of existing only for decoration.

The design should feel similar in quality to:

- Apple
- Linear
- Stripe
- Framer
- Vercel
- Awwwards-winning portfolios

Avoid template-like layouts.

---

# Visual Style

Theme

- Dark/Light
- Modern
- Premium
- Minimal

Typography

- Large headings
- Strong hierarchy
- Comfortable spacing
- Clean alignment

Colors

- High contrast
- Subtle gradients
- One primary accent color
- Minimal glassmorphism

Spacing

Prioritize whitespace.

Avoid cramped layouts.

Each section should have breathing room.

---

# Motion Guidelines

Animations should be smooth and meaningful.

Preferred technologies

- Framer Motion
- GSAP ScrollTrigger
- Lenis

Allowed animation types

- Fade
- Slide
- Blur reveal
- Scale
- Parallax
- Sticky scrolling
- Card stacking
- Mouse interactions
- Hover animations
- Text reveal
- Image reveal
- Scroll-triggered transitions

Animation should remain performant.

Support prefers-reduced-motion.

---

# Code Requirements

Keep components reusable.

Avoid duplicated code.

Separate animation logic from presentation.

Maintain clean architecture.

Do not introduce unnecessary dependencies.

Optimize for Lighthouse performance.

---

# Responsive Design

Support

- Mobile
- Tablet
- Laptop
- Desktop
- Ultra-wide monitors

The experience should remain premium across all screen sizes.

---

# Development Workflow

Before implementing any redesign:

1. Analyze the existing component.
2. Understand how it receives data.
3. Preserve existing functionality.
4. Improve only the UI.
5. Do not modify backend-related code.

Never rewrite working features solely for aesthetic reasons.

---

# Redesign Phases

The redesign should be completed incrementally.

Each phase should be finished before moving to the next.

---

## Phase 1

Global Design System

Focus on

- Typography
- Color palette
- Spacing
- Buttons
- Cards
- Shadows
- Borders
- Animations
- Reusable UI components

Do not redesign pages yet.

---

## Phase 2

Navigation

Improve

- Navbar
- Mobile navigation
- Active section indicator
- Smooth scrolling
- Scroll progress
- Navigation animations

---

## Phase 3

Hero Section

Create a memorable first impression.

Requirements

- Full-screen layout
- Animated profile image
- Mouse-follow lighting
- Large typography
- Animated CTA buttons
- Scroll indicator
- Floating background effects
- Smooth entrance animations

Do not change where the content comes from.

---

## Phase 4

About Section

Transform into a storytelling section.

Possible improvements

- Text reveal
- Highlight keywords
- Animated statistics
- Better visual hierarchy
- Image transitions

---

## Phase 5

Experience

Replace static cards with

- Vertical timeline
- Scroll-driven progression
- Animated cards
- Sticky sections

---

## Phase 6

Skills

Replace progress bars.

Create interactive technology cards.

Support categories.

Support hover interactions.

Everything remains dynamic.

---

## Phase 7

Projects

This should become the strongest section.

Implement

- Sticky scrolling
- Large project previews
- Animated galleries
- Device mockups
- Technology badges
- Hover interactions
- Smooth transitions

Do not assume a fixed number of projects.

Support unlimited projects from the backend.

---

## Phase 8

Certificates

Modern horizontal layout.

Animated scrolling.

Interactive cards.

---

## Phase 9

Achievements

Animated counters.

Timeline.

Highlight important milestones.

---

## Phase 10

Contact

Create a memorable ending.

Large CTA.

Elegant footer.

Animated social links.

Subtle background effects.

---

# Final Goal

The finished portfolio should feel modern, premium, interactive, and memorable while remaining fully compatible with the existing backend and admin panel.

The redesign should improve presentation only.

No backend functionality should be affected.