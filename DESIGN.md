---
name: Tastify Staff OS
colors:
  background: '#0a0a0a'
  on-background: '#e4e4e7'
  surface: '#121212'
  on-surface: '#ffffff'
  surface-bright: '#18181b'
  surface-container: '#1c1c1f'
  surface-container-low: '#141416'
  surface-container-high: '#27272a'
  surface-container-highest: '#3f3f46'
  outline: '#52525b'
  outline-variant: '#27272a'
  primary: '#ff5c00' # High-intensity Tactical Orange
  on-primary: '#ffffff'
  primary-container: '#4e2000'
  on-primary-container: '#ffccb3'
  accent: '#00f0ff' # Cyber Cyan for telemetry
  error: '#ff0033' # Hazard Red
  on-error: '#ffffff'
typography:
  display-macro:
    fontFamily: Geist Black
    fontSize: 64px
    fontWeight: '900'
    lineHeight: '0.9'
    letterSpacing: -0.04em
  headline-tactical:
    fontFamily: Geist Bold
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  body-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-telemetry:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.15em
rounded:
  none: 0
  sm: 2px
  DEFAULT: 4px
  md: 8px
  lg: 12px
spacing:
  unit: 4px
  grid-gap: 1px
---

# Design System: Tactical Command (Staff OS)

## 1. Visual Theme & Atmosphere
The "Staff OS" embodies a **Tactical Command Center** aesthetic. It is a high-density, Dark Mode interface designed for precision, speed, and reliability. The atmosphere is mechanical, raw, and utilitarian — discarding soft gradients and organic shapes in favor of rigid grids, monospaced telemetry, and high-contrast indicators.

## 2. Color Palette
- **Obsidian Core** (#0a0a0a) — The primary substrate. Deep, non-reflective black.
- **Tactical Orange** (#ff5c00) — The primary interactive accent. High visibility, inspired by aerospace instrumentation.
- **Cyber Cyan** (#00f0ff) — Used for secondary data visualizations and telemetry highlights.
- **Hazard Red** (#ff0033) — Strictly for alerts, errors, and critical system statuses.
- **Zinc Phosphor** (#e4e4e7) — Primary text color, simulating aged CRT phosphor.

## 3. Typography
- **Macro-Headers:** Geist Black (fallback: Inter Black). Massive scale, negative tracking, uppercase.
- **Telemetry Data:** JetBrains Mono. Used for all inputs, data points, and technical metadata.
- **Interface UI:** Geist SemiBold. Used for primary navigation and button labels.

## 4. Layout Principles
- **Rigid Compartmentalization:** Use 1px solid dividers (`border-zinc-800`) to segregate information zones.
- **Zero Radius:** Rejection of soft corners. Elements use `rounded-none` or `rounded-sm` (2px) to enforce industrial precision.
- **Bimodal Density:** Clustered data groups framed by massive, calculated negative space.
- **The Blueprint Grid:** All elements are anchored to a strict modular grid. Visible crosshairs (`+`) mark key intersections.

## 5. Components
- **Buttons:** Hard-edged rectangles. Active state uses a 1px negative translate. No glows.
- **Inputs:** Monospaced text entry. Borders illuminate in Tactical Orange on focus. 1px solid outline always.
- **Status Indicators:** ASCII-inspired markers (e.g., `[ ONLINE ]`, `< ERROR >`).
- **Telemetry Cards:** No shadows. Defined by 1px borders and internal technical labels (e.g., `UNIT-01`, `REV-B`).

## 6. Anti-Patterns (Banned)
- No emojis.
- No soft shadows or blurs (except for terminal glow).
- No rounded corners > 4px.
- No "Organic" colors (browns, tans, pastels).
- No center-aligned text for data.
- No generic serif fonts.
- No "Elevate your experience" marketing copy.
