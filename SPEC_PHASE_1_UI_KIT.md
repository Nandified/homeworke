# Phase 1 — Design System + UI Kit (Spec)

Derived from:
- `HOMEWORKE_3.0_SOURCE_OF_TRUTH.md`
- `homeworke-ui-kit-checklist.md`
- Moodboard tokens: `#E53935` red-led, calm whites, rounded cards, soft shadows

## Goals
- Lock visual tokens (color, type, radii, shadow, spacing) as CSS variables.
- Provide a small, reusable UI component set for all future flows.
- Provide a styleguide page (`/ui`) that demonstrates components and variants.

## Non-goals
- No product funnels.
- No dashboards.
- No business logic.

## Tokens
CSS variables (v1):
- `--hw-red #E53935`
- `--hw-ink #111827`
- `--hw-muted #6B7280`
- `--hw-line #E5E7EB`
- `--hw-soft #F8FAFC`
- `--hw-shadow 0 10px 30px rgba(17,24,39,.08)`
- `--hw-radius 18px` (cards)
- `--hw-radius-sm 12px` (controls)

## Components (v1)
- `Container`
- `Card`
- `Pill` / `Badge`
- `Button` (primary, secondary, ghost, destructive)
- `Input`, `Textarea`, `Label`
- `Checkbox`
- `RadioCardGroup` (simple, for progressive disclosure screens)
- `Chip`
- `Divider`
- `EmptyState`
- `StatTile`
- `Modal` (shell)
- `Toast` (shell)

## Page
- `/ui` — internal styleguide showcasing tokens + components.
