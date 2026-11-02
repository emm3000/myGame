---
paths:
  - "apps/web/**"
  - "apps/android/**"
  - "apps/ios/**"
  - "apps/desktop/**"
---
# UI components

## One design system, one implementation per client

- The design system is defined once as tokens: color, type, spacing, radius, motion (ADR 034). Each client implements them in its own idiom: `apps/web/src/design/tokens.ts` on the web, `core:designsystem` on Android, a SwiftUI theme on Apple. Until the shared token source and its drift check land with the redesign, the web's `tokens.ts` is the source.
- A visual value (a color, a size, a spacing, a radius, a duration) is a token. A feature screen never writes a literal one; it reuses a token or adds one to the source.
- A feature screen builds only from its client's design-system components. It never imports a raw third-party control: no Material3 `Button` or `Text` on Android, no unstyled library widget on the web.
- Before creating a component, look in the design system. Used by one screen, it stays in that feature; used by two, it moves into the design system. A local copy of a component that exists is a defect; extend the shared one.

## Touch targets

Every interactive element meets its platform's minimum: 48×48 dp on Android, 44×44 pt on Apple, 44×44 CSS px on the web. A target larger than its artwork keeps the size and draws the artwork inside it, never the reverse.

## States

- Every screen that loads data draws four states: loading, empty, error, content. The error state offers the retry.
- Pressing a control is acknowledged at finger-down.
- A disabled or busy control stays in the layout and stays announced as a disabled button; it is never hidden because it is disabled.

## Accessibility floor

- Contrast at least 4.5:1 for text, 3:1 for large text and for the boundary of a control, measured on the ground it sits on. No token is grandfathered; an exempt pair cites its WCAG clause, as `apps/web/src/design/tokens.test.ts` does.
- Every interactive element has an accessible name (a label, a `contentDescription`, an `aria-label`). A decorative graphic is hidden from assistive technology.
- Meaning never rides on color or a sign alone: a gain or a shortage carries words a screen reader reads.
- The system font scale and reduced-motion setting are respected.

## Icons

Icons are vector assets or drawn paths from the design system, never emoji.
