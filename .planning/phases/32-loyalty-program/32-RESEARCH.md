# Phase 32: Loyalty Program - Research

**Researched:** 2026-05-08
**Domain:** Customer Loyalty & Gamification
**Confidence:** HIGH

## Summary
Implementation of a points-based loyalty system where clients earn points for every MAD spent and can redeem them for rewards. The system integrates with the existing payment flow and provides visibility to both clients and managers.

## Architectural Responsibility Map
| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Points Calculation | API / Backend | — | Business logic must be server-side for integrity. |
| Reward Redemption | API / Backend | — | Atomic transaction required to deduct points. |
| Loyalty Dashboard | Browser / Client | — | Displaying balance and history to the user. |
| Rewards Config | Browser / Client | — | Manager UI in Back-office. |

## Standard Stack
- **Django Signals**: For decoupled point awarding on payment completion.
- **Decimal**: High-precision math for point conversion.
- **Lucide-react**: Icons for tiers (Bronze/Silver/Gold).

## Architecture Patterns
- **Signal-Based Awarding**: Listen to `paiements.Paiement` completion to update `LoyaltyProfile`.
- **Transaction History**: Every point change must have a corresponding `LoyaltyTransaction` record.

## Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency/Points precision | Float math | `Decimal` | Avoid rounding errors in financial/loyalty logic. |

## Common Pitfalls
- **Double Counting**: Ensure signals don't fire multiple times for the same payment.
- **Negative Balance**: Prevent redemption if points < cost (Database constraints).
