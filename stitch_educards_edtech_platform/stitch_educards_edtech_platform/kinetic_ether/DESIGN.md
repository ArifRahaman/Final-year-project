---
name: Kinetic Ether
colors:
  surface: '#10141a'
  surface-dim: '#10141a'
  surface-bright: '#353940'
  surface-container-lowest: '#0a0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2eb'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#007650'
  on-tertiary-container: '#76ffc2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width: 1280px
---

## Brand & Style

The design system is anchored in a high-performance, futuristic aesthetic tailored for the next generation of digital learning. It targets a tech-literate audience that values focus, speed, and visual depth.

The style is a sophisticated blend of **Glassmorphism** and **Modern Minimalism**, heavily influenced by the precision of developer-centric tools. The interface relies on translucency to create a sense of layering and "HUD-like" immersion. By utilizing backdrop filters and subtle glows rather than heavy shadows, the system maintains a lightweight, ephemeral quality while feeling rooted in a premium, dark-mode environment.

## Colors

The palette is built on a foundational deep navy (`#0d1117`), which provides the necessary "void" for glass effects to pop.

- **Primary Violet:** Used for high-intent actions and brand-defining gradients. It represents intelligence and creativity.
- **Secondary Cyan:** Used for accents, information highlights, and progress indicators.
- **Surface Strategy:** Backgrounds are never pure black; they utilize the deep navy base. Elements use a semi-transparent white overlay with a `backdrop-filter: blur()` to create the frosted glass effect.
- **Gradients:** Use a linear gradient from Primary Violet to Secondary Cyan (45 degrees) for feature cards or primary CTA backgrounds to evoke a sense of kinetic energy.

## Typography

This design system utilizes **Inter** exclusively to ensure maximum legibility and a systematic, technical feel.

- **Weight Usage:** Use Bold (700) and Semi-Bold (600) for hierarchy in headlines. Regular (400) is reserved for body text to maintain a clean, airy feel.
- **Letter Spacing:** Headlines utilize negative letter spacing to create a compact, "engineered" look. Labels and small captions use slight positive tracking to ensure readability against dark, blurred backgrounds.
- **Color:** Primary text should be pure white (`#FFFFFF`). Secondary text should use a high-opacity white (`rgba(255, 255, 255, 0.7)`) to maintain contrast without visual noise.

## Layout & Spacing

The system follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile.

- **Spacing Rhythm:** An 8px base unit drives all padding and margins.
- **Density:** The layout is airy yet structured. Content should be grouped in glass containers with internal padding of at least 24px (3x base) to allow the background blur to be appreciated.
- **Alignment:** Use rigid, left-aligned typography to mirror the structured nature of coding environments. Centered text is reserved only for high-impact display moments or empty states.

## Elevation & Depth

Depth is not communicated through shadows, but through **Tonal Opacity** and **Backdrop Blurs**.

- **Level 0 (Base):** Deep Navy background.
- **Level 1 (Surface):** 3% white opacity with a 12px blur and 1px border (`rgba(255, 255, 255, 0.08)`).
- **Level 2 (Modals/Popovers):** 6% white opacity with a 20px blur and a subtle violet inner-glow (1px spread).
- **Interactive States:** When hovering over a card, the border opacity should increase from 8% to 20%, and a faint violet radial gradient should appear behind the cursor position (Spotlight effect).

## Shapes

The shape language is "Soft-Modern." Elements use a consistent 0.5rem (8px) corner radius to balance the technicality of the typography with a more approachable feel.

- **Standard Elements:** 8px radius (buttons, input fields, small chips).
- **Large Containers:** 16px (1rem) radius (cards, modal containers).
- **Buttons:** Maintain the 8px radius; avoid full pill-shapes to stay within the "engineered" aesthetic of the design system.

## Components

### Buttons
- **Primary:** Violet to Cyan gradient background, white text, no border. Subtle outer violet glow on hover.
- **Secondary:** Glass background (Level 1), 1px white border (0.1 opacity).
- **Ghost:** No background, white text. Becomes Level 1 glass on hover.

### Cards (The "EduCards")
- **Visuals:** Use the Level 1 glass treatment. Ensure a 1px solid border is applied to define the edges against the dark background.
- **Content:** Information should be layered clearly with Semi-Bold headers and subtle cyan icons.

### Input Fields
- **Default:** Dark navy fill (slightly lighter than base), 1px border (`rgba(255, 255, 255, 0.1)`).
- **Focus:** Border changes to Primary Violet with a 2px outer glow (0.3 opacity).

### Chips & Tags
- Small, uppercase labels with a 1px border. Use Primary Violet for "New" or "Active" and Semantic colors for status.

### Progress Indicators
- Linear bars using the Primary-to-Secondary gradient. The "track" of the bar should be a semi-transparent navy.

### Navigation
- Top-anchored bar with high backdrop-blur (30px) and a single 1px border on the bottom edge.