---
name: Poppy Wordy Aesthetic
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#3f4941'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#6f7a71'
  outline-variant: '#bec9bf'
  surface-tint: '#086c42'
  primary: '#086c42'
  on-primary: '#ffffff'
  primary-container: '#8ee4af'
  on-primary-container: '#00683e'
  inverse-primary: '#83d8a4'
  secondary: '#9e3f49'
  on-secondary: '#ffffff'
  secondary-container: '#fc8992'
  on-secondary-container: '#75202c'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#f7ce48'
  on-tertiary-container: '#6e5700'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9ef5bf'
  primary-fixed-dim: '#83d8a4'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#005230'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b6'
  on-secondary-fixed: '#40000d'
  on-secondary-fixed-variant: '#7f2833'
  tertiary-fixed: '#ffe087'
  tertiary-fixed-dim: '#ebc23e'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.5'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.2'
  label-sm:
    fontFamily: Lexend
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 64px
  tile-gap: 12px
  safe-margin: 32px
---

## Brand & Style

The design system is defined by an energetic yet disciplined 2D minimalist aesthetic. It prioritizes clarity and playfulness, balancing the intellectual challenge of a word game with the tactile joy of "popping" visual feedback. 

The design style is **Minimalist with Tactile Flat influences**. It avoids heavy gradients or complex textures in favor of clean silhouettes, generous whitespace, and purposeful motion. Every interaction should feel responsive and buoyant, evoking a sense of lightness and friendly competition. The target audience seeks a premium, "zen-like" gaming experience that feels contemporary and approachable.

## Colors

This design system utilizes a high-vibrancy, low-aggression palette. The core colors are selected to "pop" against both the light off-white background and the high-contrast dark charcoal mode.

- **Pastel Mint (Primary):** Used for "correct" states, progress indicators, and primary navigation buttons.
- **Soft Coral (Secondary):** Reserved for high-energy accents, "error" states, or secondary interactive elements like power-ups.
- **Sunny Yellow (Tertiary):** Dedicated to achievements, highlights, and attention-grabbing UI flourishes like star ratings or currency.
- **Backgrounds:** The primary interface uses a warm off-white to reduce eye strain during long reading sessions. A dark mode alternative uses a deep charcoal to maintain the "popping" effect of the pastel accents.

## Typography

The typography in this design system is selected for its friendly, rounded geometry. **Plus Jakarta Sans** serves as the primary typeface, offering a welcoming and modern feel for headlines and UI labels. Its open counters and soft terminals reinforce the "wordy" nature of the product while remaining highly legible.

**Lexend** is employed for labels and micro-copy, particularly where readability is paramount during fast-paced gameplay. The combination ensures the interface feels approachable and sophisticated. Headlines should use tight letter spacing and heavy weights to create a "bold" presence that anchors the minimalist layout.

## Layout & Spacing

This design system utilizes a **honeycomb grid** for the main game board and a **fluid grid** for menus and settings. The layout philosophy emphasizes vertical rhythm and central alignment to keep the player focused on the word-building area.

Spacing is based on an 8px base unit. Generous margins (Safe-margin) ensure that UI elements do not feel cluttered, even on smaller mobile screens. Elements on the game board (tiles, letter slots) use a dedicated "tile-gap" to ensure clear separation and touch-target accuracy, emphasizing the minimalist "2D" structure.

## Elevation & Depth

Visual hierarchy is achieved through **ambient shadows** and **tonal layering**. Rather than using traditional skeuomorphism, this design system uses soft, diffused shadows with a slight color tint (based on the surface color) to make elements appear as if they are floating slightly above the background.

Buttons and active tiles should feature a subtle "pressed" state where the shadow Y-offset decreases, simulating physical displacement. Elevated surfaces, such as modal cards or "pop-up" menus, use a secondary layer of off-white (or lighter charcoal) to differentiate themselves from the base canvas.

## Shapes

The shape language is consistently **Rounded**. Sharp corners are avoided to maintain the friendly, approachable vibe. Standard UI containers use a 0.5rem radius, while larger cards and modals use 1.5rem to create a softer, more inviting enclosure.

Letter tiles—the core of the game—should be treated as "super-ellipses" or heavily rounded squares to maximize the "poppy" feel when they are tapped or animated. This consistent roundedness reinforces the brand's energetic yet clean identity.

## Components

### Buttons
Primary buttons are pill-shaped or heavily rounded, using the Primary Mint or Secondary Coral colors. They feature a subtle bottom-heavy shadow to indicate interactivity. Text is centered, using the `label-lg` style.

### Game Tiles
The central component. Tiles are squares with `rounded-lg` corners. In their idle state, they sit on a soft shadow. When selected, they scale up by 10% and the shadow deepens. Correct letters flash Sunny Yellow before settling into Mint.

### Chips & Badges
Used for difficulty levels or category tags. These are small, pill-shaped elements with low-contrast backgrounds and high-contrast text.

### Progress Bars
Horizontal tracks with 100% rounded ends. The container is a light grey/charcoal, while the "fill" uses the Primary Mint color to provide a clear sense of momentum.

### Modals & Cards
Large, centered containers with `rounded-xl` corners. They use a light ambient shadow to separate from the game board. Headers inside modals are centered using `headline-lg`.

### Input Fields (Word Entry)
Clean, flat underlines or soft-rounded boxes. The focus state is indicated by a thicker Mint border rather than a change in background color.