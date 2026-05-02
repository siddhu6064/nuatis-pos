# Nuatis POS — Prototype

> **Throwaway prototype built with Replit Agent for UX validation only. Code quality is exploratory. Do NOT use as basis for production POS build. Production POS build follows separate Master Plan documents.**

## Overview

Quick-tile register screen for Nuatis POS — a service-based point-of-sale system for salons. This prototype validates UX flow and visual hierarchy on a tablet-sized screen (iPad portrait, 1024×768).

## Scope (Batch 1)

- Authenticated register screen with 12 hardcoded salon services
- 4×3 tile grid, color-coded by category
- Live ticking clock in header
- Replit Auth login/logout

## What's NOT built (yet)

- Cart panel, checkout, tip selection, payment screens (Batch 2+)
- Customer search, staff PIN, multi-vertical switching, settings

## Running

```bash
pnpm --filter @workspace/nuatis-pos run dev
```
